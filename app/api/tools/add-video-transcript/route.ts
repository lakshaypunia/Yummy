import { NextRequest, NextResponse } from "next/server";
import { generateBlocks } from "@/lib/agent2/tools/generate-blocks";
import { updatePage } from "@/lib/agent2/tools/update-page";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { url, transcript, pageId } = await req.json();

        if (!url || !pageId || !transcript) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        // 1. Add the video block first
        await updatePage({
            pageId,
            blockType: "video",
            data: url
        }, { userId });

        // 2. Generate blocks from transcript
        const blocksPromising = await generateBlocks({ 
            prompt: `Convert this video transcript into a well-structured set of blocks (headings, paragraphs, lists) with nice formatting and colors where appropriate. Do not just copy paste, synthesize it nicely into notes: \n\n${transcript}` 
        });

        // 3. Add the generated blocks
        if (blocksPromising && blocksPromising.length > 0) {
            await updatePage({
                pageId,
                blockType: "blocks",
                data: blocksPromising
            }, { userId });
        }

        return NextResponse.json({
            success: true
        });

    } catch (error: any) {
        console.error("❌ Add Video Transcript API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
