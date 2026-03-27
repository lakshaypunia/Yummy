import { AgentState } from '../state'
import { prisma } from '@/lib/prisma'

export async function loadContextNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log(`\n[Agent - Load Context] Starting context load for pageId: ${state.pageId ?? 'None'}`)
  if (!state.pageId) {
    return {
      hasPdf: false,
      pdfFileUri: null,
      currentBlocks: [],
    }
  }

  const page = await prisma.page.findUnique({ where: { id: state.pageId } })
  if (!page) {
    return {
      hasPdf: false,
      pdfFileUri: null,
      currentBlocks: [],
    }
  }

  // @ts-ignore
  const hasPdf = (state.selectedDocs && state.selectedDocs.length > 0) || !!page.geminiFileUri
  // @ts-ignore
  const pdfFileUri = page.geminiFileUri || null
  const currentBlocks = (page.blockJson as any[]) || []

  console.log(`[Agent - Load Context] Result -> hasPdf: ${hasPdf}, Blocks count: ${currentBlocks.length}`)
  return {
    hasPdf,
    pdfFileUri,
    currentBlocks,
    selectedDocs: state.selectedDocs ?? [],
  }
}
