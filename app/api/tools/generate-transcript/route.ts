import { NextRequest, NextResponse } from "next/server";
import { generateTranscript } from "@/lib/agent2/tools/generate-transcript";

export async function POST(req: NextRequest) {
    try {
        const { url, type } = await req.json();

        if (!url || !type) {
            return NextResponse.json({ success: false, message: "Missing url or type" }, { status: 400 });
        }

        const transcript = await generateTranscript({ url, type });
        
        return NextResponse.json({
            success: true,
            transcript
        });

    } catch (error: any) {
        console.error("❌ Transcript API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
