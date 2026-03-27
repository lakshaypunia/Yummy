import { ai } from '@/lib/ai/ai.service'

export async function createP5(input: { topic: string }) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: input.topic }] }],
    config: {
      systemInstruction: `You are an expert p5.js developer. Generate an interactive p5.js sketch based on the user's request. 
      Output MUST be a complete, self-contained HTML file snippet containing the CDNs and script tags ready to be embedded in an iframe.
      Do NOT include markdown fencing like \`\`\`html. Return ONLY the raw HTML string.`
    }
  });
  let rawHtml = response.text || "";
  rawHtml = rawHtml.replace(/```html/g, '').replace(/```/g, '').trim();
  return rawHtml;
}
