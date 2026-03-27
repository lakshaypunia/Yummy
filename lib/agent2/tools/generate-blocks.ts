import { ai } from '@/lib/ai/ai.service'

const SYSTEM_PROMPT = `
You are an expert document formatter for BlockNote editor.
Convert the user's prompt into a strict JSON array of BlockNote PartialBlock objects.
Pay close attention to any styling requests from the user (e.g. text color, background color, headings).

SUPPORTED BLOCK TYPES:
- "paragraph": Standard text.
- "heading": A title. Props should include level (1, 2, or 3).
- "bulletListItem": A bulleted list item.
- "numberedListItem": A numbered list item.

SUPPORTED PROPS (applicable to all above types):
- textColor: "default", "gray", "brown", "red", "orange", "yellow", "green", "blue", "purple", "pink"
- backgroundColor: "default", "gray", "brown", "red", "orange", "yellow", "green", "blue", "purple", "pink"
- textAlignment: "left", "center", "right", "justify"

CONTENT STYLING:
The 'content' field should be an array of inline content objects if specific text styling is needed, or a simple string for plain text.
Inline content object format: { type: "text", text: string, styles: { bold?: boolean, italic?: boolean, underline?: boolean, strike?: boolean, textColor?: string, backgroundColor?: string } }

OUTPUT FORMAT:
Return ONLY a valid JSON array of objects.
Example:
[
  {
    "type": "heading",
    "props": { "level": 1, "textColor": "red" },
    "content": "This is a Red Heading"
  },
  {
    "type": "paragraph",
    "props": { "backgroundColor": "yellow" },
    "content": [
      { "type": "text", "text": "This is highlighted yellow " },
      { "type": "text", "text": "and bold", "styles": { "bold": true } }
    ]
  }
]
`.trim();

export async function generateBlocks(input: { prompt: string }) {
  console.log(`[Agent Tools - generateBlocks] Generating blocks for prompt: "${input.prompt.slice(0, 50)}..."`);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
    config: { 
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json'
    }
  })
  
  try {
    const rawText = response.text ?? '[]';
    // Sometimes LLM wraps JSON in markdown block even with application/json
    const cleanedText = rawText.replace(/^```json\n/, '').replace(/\n```$/, '');
    const blocks = JSON.parse(cleanedText);
    
    return Array.isArray(blocks) ? blocks : [blocks];
  } catch (err) {
    console.error("[Agent Tools - generateBlocks] Failed to parse blocks JSON:", err);
    console.error("Raw response:", response.text);
    return [];
  }
}
