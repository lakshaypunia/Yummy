export const TOOLS = [
  {
    name: 'generate_text' as const,
    description: 'Answer a question, explain a concept, or handle casual conversation. Use when the user just wants a reply with no page modifications.',
    inputSchema: { prompt: 'string' },
    onErrorDefault: 'skip' as const,
  },
  {
    name: 'generate_blocks' as const,
    description: 'Generate formatted document text, headings, lists, or colored text as structured BlockNote JSON. Use this when the user asks to add styled text, formatted content, or color-coded headings to the page.',
    inputSchema: { prompt: 'string' },
    onErrorDefault: 'skip' as const,
  },
  {
    name: 'read_pdf' as const,
    description: 'Extract the full text content from the PDF document attached to the current page. MUST be called before any other tool that needs document content. Requires hasPdf=true.',
    inputSchema: { pageId: 'string' },
    onErrorDefault: 'stop' as const,
  },
  {
    name: 'generate_script' as const,
    description: 'Use an LLM to convert raw text or a topic into a narrated educational video script.',
    inputSchema: { topic: 'string', sourceText: 'string (optional - pass PDF text here if available)' },
    onErrorDefault: 'stop' as const,
  },
  {
    name: 'render_video' as const,
    description: 'Render a Manim animation video from a script. Returns a video blob URL. Long-running (up to 3 minutes).',
    inputSchema: { script: 'string' },
    onErrorDefault: 'stop' as const,
  },
  {
    name: 'create_diagram' as const,
    description: 'Generate a Mermaid diagram converted to Excalidraw elements for a given topic.',
    inputSchema: { topic: 'string', sourceText: 'string (optional)' },
    onErrorDefault: 'skip' as const,
  },
  {
    name: 'create_desmos' as const,
    description: 'Generate a Desmos graphing calculator with equations for a math topic.',
    inputSchema: { topic: 'string' },
    onErrorDefault: 'skip' as const,
  },
  {
    name: 'create_p5' as const,
    description: 'Generate an interactive p5.js sketch embedded in the page.',
    inputSchema: { topic: 'string' },
    onErrorDefault: 'skip' as const,
  },
  {
    name: 'update_page' as const,
    description: 'Append a completed block (video, diagram, text, etc.) to the current page and broadcast to all connected clients.',
    inputSchema: { pageId: 'string', blockType: 'string', data: 'object (the output from the prior tool)' },
    onErrorDefault: 'skip' as const,
  },
] as const

export type ToolName = typeof TOOLS[number]['name']

export const TOOL_NAMES = TOOLS.map(t => t.name)

export const toolDocs = TOOLS
  .map(t =>
    `- ${t.name}: ${t.description}\n  inputs: ${JSON.stringify(t.inputSchema)}\n  default onError: "${t.onErrorDefault}"`
  )
  .join('\n\n')
