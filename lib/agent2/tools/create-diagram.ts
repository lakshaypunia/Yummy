import { ai } from '@/lib/ai/ai.service'

export async function createDiagram(input: { topic: string, sourceText?: string }) {
  const prompt = `Topic: ${input.topic}\nSource Material: ${input.sourceText || 'None'}\nGenerate a Mermaid diagram representing this topic.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: `You are an expert at creating Mermaid.js diagrams.
Generate a valid Mermaid diagram representing the user's request.
CRITICAL RULES:
1. ONLY use 'flowchart TD' or 'flowchart LR'. Do not use sequence diagrams, class diagrams, etc.
2. Output ONLY the raw Mermaid code. 
3. Do NOT include markdown formatting like \`\`\`mermaid or \`\`\`. Just the raw code.`,
    }
  });

  let mermaidCode = response.text || "";
  mermaidCode = mermaidCode.replace(/```mermaid/gi, '').replace(/```/g, '').trim();

  try {
    // Instead of parsing server-side which fails due to DOMPurify/JSDOM issues,
    // we return the raw mermaid code and let the client-side editor parse to Excalidraw.
    return { mermaidCode };
  } catch (error) {
    console.warn("Failed to process Mermaid diagram.", error);
    // Return a basic Excalidraw text element indicating the diagram could not be parsed
    return {
      mermaidCode: null,
      error: "Failed to generate diagram."
    }
  }
}
