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

export interface StepResult {
  status: 'success' | 'failed' | 'skipped'
  output: any
  error?: string
}

export type ToolName =
  | 'generate_text'
  | 'read_pdf'
  | 'generate_blocks'
  | 'generate_script'
  | 'render_video'
  | 'update_page'
  | 'create_diagram'
  | 'create_desmos'
  | 'create_p5'
