import { PlannerOutput } from './types'

export function validateDAG(plan: PlannerOutput, knownTools: string[]): { ok: boolean; errors: string[] } {
  const errors: string[] = []

  if (plan.steps.length > 10) {
    errors.push('Plan has more than 10 steps.')
  }

  const stepIds = new Set<string>()
  
  for (const step of plan.steps) {
    if (stepIds.has(step.id)) {
      errors.push(`Duplicate step ID found: ${step.id}`)
    }
    stepIds.add(step.id)

    if (!knownTools.includes(step.tool)) {
      errors.push(`Unknown tool name: ${step.tool} in step ${step.id}`)
    }
  }

  for (const step of plan.steps) {
    for (const dep of step.dependsOn) {
      if (!stepIds.has(dep)) {
        errors.push(`Missing dependsOn reference: ${dep} in step ${step.id}`)
      }
    }
  }

  if (errors.length === 0) {
    const inDegree = new Map<string, number>()
    const adj = new Map<string, string[]>()
    
    for (const id of stepIds) {
      inDegree.set(id, 0)
      adj.set(id, [])
    }
    
    for (const step of plan.steps) {
      for (const dep of step.dependsOn) {
        adj.get(dep)!.push(step.id)
        inDegree.set(step.id, inDegree.get(step.id)! + 1)
      }
    }
    
    const queue: string[] = []
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id)
    }
    
    let visited = 0
    while (queue.length > 0) {
      const curr = queue.shift()!
      visited++
      for (const neighbor of adj.get(curr)!) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1)
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor)
        }
      }
    }
    
    if (visited < plan.steps.length) {
      errors.push('Cycle detected in DAG.')
    }
  }

  return { ok: errors.length === 0, errors }
}
