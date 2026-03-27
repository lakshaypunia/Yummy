import { ai } from '@/lib/ai/ai.service'
import { prisma } from '@/lib/prisma'

export async function readPdf(input: { pageId: string }) {
  const page = await prisma.page.findUnique({ where: { id: input.pageId } })
  // @ts-ignore
  if (!page || !page.geminiFileUri) throw new Error("No PDF attached")

  // @ts-ignore
  let contentParts: any[] = [{ fileData: { fileUri: page.geminiFileUri, mimeType: 'application/pdf' } }, { text: 'Extract all the text content from this document verbatim or as detailed as possible.' }]
  
  let reqConfig: any = { systemInstruction: "Extract full text content from PDF." }
  // @ts-ignore
  if (page.geminiCacheName) {
    // @ts-ignore
    reqConfig.cachedContent = page.geminiCacheName
    contentParts = [{ text: 'Extract all the text content from this document verbatim or as detailed as possible.' }]
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: contentParts }],
    config: reqConfig
  })
  
  return response.text ?? ''
}
