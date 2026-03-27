import { ai } from '@/lib/ai/ai.service'

export async function createDesmos(input: { topic: string }) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: input.topic }] }],
    config: {
      systemInstruction: `You are an expert math teacher and Desmos power user. Generate a list of Desmos calculator expressions based on the user's request.
CRITICAL RULES FOR DESMOS LATEX:
1. NEVER use the raw '|' (pipe) symbol. It causes parsing errors.
2. Domain/Range Restrictions: Use curly braces. Do NOT use '|' or ':' as separators. 
3. Absolute Values: Use \\operatorname{abs}(x) or \\left| x \\right|.
4. JSON Escaping: You MUST double-escape all LaTeX backslashes so the output is valid JSON.

OUTPUT FORMAT:
Return ONLY a JSON array of objects.
{ "id": "graph1", "latex": "y = x^2", "color": "#c74440", "hidden": false }`,
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || '[]');
}
