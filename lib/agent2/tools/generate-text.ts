import { ai } from '@/lib/ai/ai.service'

export async function generateText(input: { prompt: string }) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
    config: { systemInstruction: "You are a helpful AI assistant." }
  })
  return response.text ?? ''
}
