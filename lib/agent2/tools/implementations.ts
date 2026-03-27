import { ToolName } from '../planner/types'
import { readPdf } from './read-pdf'
import { generateText } from './generate-text'
import { generateBlocks } from './generate-blocks'
import { generateScript } from './generate-script'
import { renderVideo } from './render-video'
import { createDiagram } from './create-diagram'
import { createDesmos } from './create-desmos'
import { createP5 } from './create-p5'
import { updatePage, broadcastProgress } from './update-page'

export { broadcastProgress }

export async function executeTool(toolName: ToolName, input: any, ctx: { userId: string, pageId: string | null }): Promise<any> {
    console.log(`[Agent - Tool Dispatch] Executing '${toolName}' with input:`, JSON.stringify(input).slice(0, 150) + "...")
    switch (toolName) {
        case 'read_pdf': 
            if (!ctx.pageId) throw new Error("pageId is required to read PDF")
            return readPdf({ pageId: ctx.pageId })
        case 'generate_text': return generateText(input)
        case 'generate_blocks': return generateBlocks(input)
        case 'generate_script': return generateScript(input)
        case 'render_video': return renderVideo(input)
        case 'create_diagram': return createDiagram(input)
        case 'create_desmos': return createDesmos(input)
        case 'create_p5': return createP5(input)
        case 'update_page': 
            if (!ctx.pageId) throw new Error("pageId is required to update page")
            return updatePage(input, { userId: ctx.userId })
        default: throw new Error(`Unknown tool ${toolName}`)
    }
}
