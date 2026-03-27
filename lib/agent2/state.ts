import { Annotation } from '@langchain/langgraph'
import { ToolCall, StepResult } from './planner/types'

export const AgentStateAnnotation = Annotation.Root({
  // ── Inputs ──────────────────────────────────────────
  userMessage:  Annotation<string>,
  pageId:       Annotation<string | null>,
  userId:       Annotation<string>,
  aiMessageId:  Annotation<string>,

  // ── Context (loaded in load_context node) ───────────
  hasPdf:         Annotation<boolean>,
  pdfFileUri:     Annotation<string | null>,
  currentBlocks:  Annotation<any[]>,

  // ── Plan (set by planner node) ───────────────────────
  mode:     Annotation<'chat' | 'agent'>,
  summary:  Annotation<string>,
  plan:     Annotation<ToolCall[]>,

  // ── Execution (updated after each executor pass) ─────
  // IMPORTANT: Use a reducer that merges rather than replaces
  stepResults: Annotation<Record<string, StepResult>, any>({
    reducer: (existing, update) => {
      if (update && update.clear === true) return {}
      return { ...existing, ...update }
    },
    default: () => ({}),
  }),

  // ── Output ───────────────────────────────────────────
  finalReply: Annotation<string>,
})

export type AgentState = typeof AgentStateAnnotation.State
