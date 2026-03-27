import { StateGraph, START, END } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { AgentStateAnnotation, AgentState } from './state'
import { loadContextNode } from './nodes/load-context'
import { plannerNode }     from './nodes/planner'
import { toolExecutorNode } from './nodes/tool-executor'
import { synthesizerNode }  from './nodes/synthesizer'

function routeAfterPlanner(state: AgentState): string {
  const next = state.mode === 'chat' ? 'synthesizer' : 'tool_executor'
  console.log(`[Agent - Routing] mode='${state.mode}', routing planner -> ${next}`)
  return next
}

function routeAfterExecutor(state: AgentState): string {
  const totalSteps = state.plan.length
  const settledSteps = Object.keys(state.stepResults).length

  const next = (settledSteps < totalSteps) ? 'tool_executor' : 'synthesizer'
  console.log(`[Agent - Routing] ${settledSteps}/${totalSteps} steps completed, routing executor -> ${next}`)
  return next
}

const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL as string)

export const agentGraph = new StateGraph(AgentStateAnnotation)
  .addNode('load_context',  loadContextNode)
  .addNode('planner',       plannerNode)
  .addNode('tool_executor', toolExecutorNode)
  .addNode('synthesizer',   synthesizerNode)
  .addEdge(START,           'load_context')
  .addEdge('load_context',  'planner')
  .addConditionalEdges('planner', routeAfterPlanner, {
    tool_executor: 'tool_executor',
    synthesizer:   'synthesizer',
  })
  .addConditionalEdges('tool_executor', routeAfterExecutor, {
    tool_executor: 'tool_executor',
    synthesizer:   'synthesizer',
  })
  .addEdge('synthesizer', END)
  .compile({ checkpointer })

let setupDone = false

export async function runAgent(params: {
  userMessage: string
  userId: string
  aiMessageId: string
  pageId?: string
}) {
  console.log(`\n======================================================`)
  console.log(`[Agent - Lifecycle] runAgent invoked for user: ${params.userId}, page: ${params.pageId ?? 'None'}`)
  
  if (!setupDone) {
    await checkpointer.setup()
    setupDone = true
  }

  const threadId = `${params.userId}-${params.pageId ?? 'global'}`

  await agentGraph.invoke(
    {
      userMessage:  params.userMessage,
      userId:       params.userId,
      aiMessageId:  params.aiMessageId,
      pageId:       params.pageId ?? null,
      stepResults:  { clear: true } as any,
    },
    { configurable: { thread_id: threadId } }
  )
  
  console.log(`[Agent - Lifecycle] Graph execution finished`)
}
