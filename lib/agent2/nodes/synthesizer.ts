import { ai } from '@/lib/ai/ai.service'
import { AgentState } from '../state'
import { prisma } from '@/lib/prisma'

async function saveAndStreamReply(reply: string, aiMessageId: string) {
  try {
    await prisma.message.update({
      where: { id: aiMessageId },
      data: { content: reply, isComplete: true },
    })

    const syncServerUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "ws://localhost:3000"
    const broadcastHttpUrl = syncServerUrl.replace("ws://", "http://").replace("wss://", "https://") + "/api/broadcast"
    
    await fetch(broadcastHttpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId: 'global',
        event: { type: 'chat-update', messageId: aiMessageId, content: reply }
      })
    })
  } catch (err) {
    console.error("Failed to save and broadcast reply:", err)
  }
}

export async function synthesizerNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log(`\n[Agent - Synthesizer] Starting synthesizer using mode: ${state.mode}`)
  if (state.mode === 'chat') {
    const chatResult = state.stepResults['step_1']?.output ?? state.plan[0]?.input?.prompt ?? ''
    await saveAndStreamReply(chatResult, state.aiMessageId)
    return { finalReply: chatResult }
  }

  const succeeded = Object.entries(state.stepResults)
    .filter(([, r]) => r.status === 'success')
    .map(([id]) => state.plan.find(s => s.id === id)?.tool)
    .filter(Boolean)

  const failed = Object.entries(state.stepResults)
    .filter(([, r]) => r.status === 'failed')
    .map(([id, r]) => `${state.plan.find(s => s.id === id)?.tool}: ${r.error}`)

  const skipped = Object.entries(state.stepResults)
    .filter(([, r]) => r.status === 'skipped')
    .map(([id]) => state.plan.find(s => s.id === id)?.tool)
    .filter(Boolean)

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `
      User asked: "${state.userMessage}"
      Plan summary: ${state.summary}
      Succeeded: ${succeeded.join(', ') || 'none'}
      Failed: ${failed.join(', ') || 'none'}
      Skipped: ${skipped.join(', ') || 'none'}

      Write a concise 1–2 sentence reply to the user describing what was done.
      If something failed, explain it plainly. If everything succeeded, confirm it warmly.
      Do not use bullet points.
    `}] }],
  })

  const reply = response.text ?? 'Done.'
  console.log(`[Agent - Synthesizer] Agent summary reply generated. Broadcasting...`)
  await saveAndStreamReply(reply, state.aiMessageId)
  return { finalReply: reply }
}
