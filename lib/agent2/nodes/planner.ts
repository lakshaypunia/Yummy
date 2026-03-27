import { ai } from '@/lib/ai/ai.service'
import { AgentState } from '../state'
import { PlannerOutput } from '../planner/types'
import { TOOL_NAMES, toolDocs } from '../planner/tool-manifest'
import { validateDAG } from '../planner/validator'

const SYSTEM_PROMPT = `
You are a task planner for a document editor AI assistant.
Analyze the user's request and available context, then output a JSON execution plan.
Output JSON only. Never add explanation or preamble outside the JSON.

TOOL DOCUMENTATION:
${toolDocs}

DAG RULES:
- dependsOn[] lists step IDs that must fully complete before this step can begin
- Steps with an empty dependsOn[] may start immediately and run in parallel with each other
- To forward output from one step to another, use the placeholder "{{step_N.output}}" as an input value
- {{context.pageId}} and {{context.userMessage}} are always available as placeholders
- No cycles — a step cannot depend on itself or any step that eventually depends on it
- onError "stop" means abort the entire plan if this step fails
- onError "skip" means mark this step failed but continue executing independent branches
- Prefer skip for enrichment steps (diagram, p5), stop for load-bearing steps (read_pdf)
- mode "chat" = user just wants a text reply, no page modifications. Put the reply in steps[0].input.prompt with tool=generate_text
- mode "agent" = one or more page modifications or tool executions are needed

OUTPUT SCHEMA:
/*
export interface ToolCall {
  id: string              // e.g. "step_1", "step_2"
  tool: ToolName          // must match a key in TOOLS
  input: Record<string, any>  // may contain "{{step_N.output}}" placeholders
  dependsOn: string[]     // IDs of steps that must complete first
  onError: 'stop' | 'skip'   // 'stop' = abort plan, 'skip' = continue
  reasoning: string       // why this step exists (for debugging)
}

export interface PlannerOutput {
  mode: 'chat' | 'agent'
  summary: string         // one sentence, shown to user immediately
  steps: ToolCall[]
}
*/

EXAMPLES:

User: "what is memoization?"
Context: hasPdf=false, pageId=null
Output: {"mode":"chat","summary":"Explain memoization","steps":[{"id":"step_1","tool":"generate_text","input":{"prompt":"what is memoization?"},"dependsOn":[],"onError":"skip","reasoning":"Simple explanation, no page action needed"}]}

User: "add a colored heading and a list about ML to the page"
Context: hasPdf=false, pageId="abc123"
Output: {"mode":"agent","summary":"Generate formatted text about ML and add to page","steps":[{"id":"step_1","tool":"generate_blocks","input":{"prompt":"A colored heading and a bullet list about Machine Learning"},"dependsOn":[],"onError":"skip","reasoning":"Generate structured BlockNote JSON"},{"id":"step_2","tool":"update_page","input":{"pageId":"abc123","blockType":"blocks","data":"{{step_1.output}}"},"dependsOn":["step_1"],"onError":"skip","reasoning":"Add generated blocks to page"}]}

User: "add a diagram of quicksort to the page"
Context: hasPdf=false, pageId="abc123"
Output: {"mode":"agent","summary":"Create a quicksort diagram and add it to the page","steps":[{"id":"step_1","tool":"create_diagram","input":{"topic":"quicksort algorithm"},"dependsOn":[],"onError":"skip","reasoning":"Visualise the algorithm"},{"id":"step_2","tool":"update_page","input":{"pageId":"abc123","blockType":"diagram","data":"{{step_1.output}}"},"dependsOn":["step_1"],"onError":"skip","reasoning":"Add diagram block to page"}]}

User: "create a video from this PDF and also add a concept diagram"
Context: hasPdf=true, pageId="abc123"
Output: {"mode":"agent","summary":"Read PDF, generate video and diagram in parallel, add both to page","steps":[{"id":"step_1","tool":"read_pdf","input":{"pageId":"abc123"},"dependsOn":[],"onError":"stop","reasoning":"Must extract PDF text first — both downstream tasks need it"},{"id":"step_2","tool":"generate_script","input":{"topic":"{{context.userMessage}}","sourceText":"{{step_1.output}}"},"dependsOn":["step_1"],"onError":"stop","reasoning":"Turn PDF content into a video script"},{"id":"step_3","tool":"render_video","input":{"script":"{{step_2.output}}"},"dependsOn":["step_2"],"onError":"stop","reasoning":"Render Manim animation"},{"id":"step_4","tool":"create_diagram","input":{"topic":"{{context.userMessage}}","sourceText":"{{step_1.output}}"},"dependsOn":["step_1"],"onError":"skip","reasoning":"Runs in parallel with step_2/3 — uses same PDF text, independent of video"},{"id":"step_5","tool":"update_page","input":{"pageId":"abc123","blockType":"multi","data":{"video":"{{step_3.output}}","diagram":"{{step_4.output}}"}},"dependsOn":["step_3","step_4"],"onError":"skip","reasoning":"Add both blocks after both parallel branches complete"}]}
`.trim()

export async function plannerNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log(`\n[Agent - Planner] Starting planner for message: "${state.userMessage}"`)
  const userTurn = `
USER MESSAGE: "${state.userMessage}"
CONTEXT: pageId=${state.pageId ?? 'none'}, hasPdf=${state.hasPdf}
`.trim()

  for (let attempt = 0; attempt < 3; attempt++) {
    console.log(`[Agent - Planner] LLM attempt ${attempt + 1}...`)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userTurn }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    })

    let raw: PlannerOutput
    try {
      raw = JSON.parse(response.text ?? '{}')
    } catch {
      console.error(`[Agent - Planner] Failed to parse JSON on attempt ${attempt + 1}`)
      continue
    }

    console.log(`[Agent - Planner] Raw JSON returned:`, JSON.stringify(raw).slice(0, 150) + "...")
    const validation = validateDAG(raw, TOOL_NAMES as unknown as string[])
    if (validation.ok) {
      console.log(`[Agent - Planner] Plan validation SUCCESS. Mode: ${raw.mode}, Steps: ${raw.steps?.length ?? 0}`)
      return { mode: raw.mode, summary: raw.summary, plan: raw.steps }
    }
    console.warn(`[Agent - Planner] Plan validation FAILED:`, validation.errors)
  }

  console.error('Planner failed 3 times, falling back to chat')
  return {
    mode: 'chat',
    summary: 'Answering directly',
    plan: [{ id: 'step_1', tool: 'generate_text',
      input: { prompt: state.userMessage },
      dependsOn: [], onError: 'skip', reasoning: 'Planner fallback' }],
  }
}
