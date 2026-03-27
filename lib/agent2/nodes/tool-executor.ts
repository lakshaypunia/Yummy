import { AgentState } from '../state'
import { StepResult } from '../planner/types'
import { executeTool, broadcastProgress } from '../tools/implementations'

export async function toolExecutorNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log(`\n[Agent - Tool Executor] Starting executor pass`)
  const completedIds = new Set(
    Object.entries(state.stepResults)
      .filter(([, r]) => r.status === 'success')
      .map(([id]) => id)
  )
  const failedIds = new Set(
    Object.entries(state.stepResults)
      .filter(([, r]) => r.status === 'failed')
      .map(([id]) => id)
  )

  // Find if any 'stop' step failed
  const stopFailed = state.plan.some(s => failedIds.has(s.id) && s.onError === 'stop')

  // Find steps to skip
  const toSkip = state.plan.filter(step => {
    if (state.stepResults[step.id]) return false  // already has result
    
    // Skip if a 'stop' step failed anywhere
    if (stopFailed) return true

    // Skip if a dependency failed or was skipped
    const depFailedOrSkipped = step.dependsOn.some(dep => {
      const res = state.stepResults[dep]?.status;
      return res === 'failed' || res === 'skipped';
    })
    
    return depFailedOrSkipped;
  })

  // Find steps that are ready to run
  const readySteps = state.plan.filter(step => {
    if (state.stepResults[step.id]) return false         // already ran
    if (toSkip.find(s => s.id === step.id)) return false // being skipped
    return step.dependsOn.every(dep => completedIds.has(dep))
  })

  if (toSkip.length > 0) console.log(`[Agent - Tool Executor] Skipping steps:`, toSkip.map(s => s.id))
  if (readySteps.length === 0 && toSkip.length === 0) console.log(`[Agent - Tool Executor] No steps ready!`)
  if (readySteps.length > 0) console.log(`[Agent - Tool Executor] Ready steps to execute:`, readySteps.map(s => s.id))

  const newResults: Record<string, StepResult> = {}

  // Mark skipped steps
  for (const step of toSkip) {
    newResults[step.id] = { status: 'skipped', output: null }
  }

  // Resolve {{step_N.output}} and {{context.*}} placeholders
  function resolvePlaceholders(item: any): any {
    if (typeof item === 'string') {
      const exactMatch = item.match(/^\{\{(\w+)\.output\}\}$/)
      if (exactMatch) {
        const id = exactMatch[1]
        if (state.stepResults[id] && state.stepResults[id].status === 'success') {
          return state.stepResults[id].output
        }
      }

      return item
        .replace(/\{\{(\w+)\.output\}\}/g, (_, id) => {
          const out = state.stepResults[id]?.output;
          return typeof out === 'string' ? out : JSON.stringify(out) ?? '';
        })
        .replace(/\{\{context\.pageId\}\}/g, state.pageId ?? '')
        .replace(/\{\{context\.userMessage\}\}/g, state.userMessage)
    }

    if (Array.isArray(item)) {
      return item.map(resolvePlaceholders);
    }

    if (item !== null && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item).map(([k, v]) => [k, resolvePlaceholders(v)])
      )
    }

    return item;
  }

  // Run ready steps in parallel
  const settled = await Promise.allSettled(
    readySteps.map(step =>
      executeTool(step.tool, resolvePlaceholders(step.input), {
        userId: state.userId,
        pageId: state.pageId,
      })
    )
  )

  // Collect results
  readySteps.forEach((step, i) => {
    const result = settled[i]
    if (result.status === 'fulfilled') {
      console.log(`[Agent - Tool Executor] Step '${step.id}' SUCCESS`)
      newResults[step.id] = { status: 'success', output: result.value }
    } else {
      console.error(`[Agent - Tool Executor] Step '${step.id}' FAILED:`, (result.reason as Error)?.message)
      newResults[step.id] = { status: 'failed', output: null, error: (result.reason as Error)?.message ?? 'Unknown error' }
    }
  })

  // Broadcast progress to client
  if (state.pageId) {
    await broadcastProgress(state.pageId, newResults)
  }

  return { stepResults: newResults }  // merged by the reducer in state
}
