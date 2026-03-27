import { ai } from '@/lib/ai/ai.service'
import { prisma } from '@/lib/prisma'

export async function readPdf(input: { pageId: string }, selectedDocs?: any[]) {
  const page = await prisma.page.findUnique({ where: { id: input.pageId } })

  let contentParts: any[] = [{ text: 'Extract all the text content from this document verbatim or as detailed as possible.' }];
  let reqConfig: any = { systemInstruction: "Extract full text content from PDF." }

  if (selectedDocs && selectedDocs.length > 0) {
    for (const doc of selectedDocs) {
      if (doc.url) {
        const fetchRes = await fetch(doc.url);
        const arrayBuffer = await fetchRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        contentParts.push({
          inlineData: {
            data: base64,
            mimeType: doc.type?.includes("pdf") ? "application/pdf" : (doc.type || "application/pdf")
          }
        });
      }
    }
  } else if (page && (page as any).geminiFileUri) {
    contentParts.push({ fileData: { fileUri: (page as any).geminiFileUri, mimeType: 'application/pdf' } });
    if ((page as any).geminiCacheName) {
      reqConfig.cachedContent = (page as any).geminiCacheName;
      // When using cache, we only pass the prompt, not the file again
      contentParts = [{ text: 'Extract all the text content from this document verbatim or as detailed as possible.' }];
    }
  } else {
    throw new Error("No PDF attached");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: contentParts }],
    config: reqConfig
  })
  
  return response.text ?? ''
}
