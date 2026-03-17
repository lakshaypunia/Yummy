// @/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AgentOrchestrator } from "../../../../lib/agent/agent.service";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const { chatId, content } = await req.json();

        // 1. Database Setup
        await prisma.message.create({
            data: { chatId, role: "USER", content, isComplete: true },
        });

        const aiMessage = await prisma.message.create({
            data: { chatId, role: "SYSTEM", content: "", isComplete: false },
        });

        // 2. Delegate to the Agent Orchestrator
        // This is the "Big Reveal" wait point
        const result = await AgentOrchestrator.run(content, userId, aiMessage.id);

        // 3. Final DB Update
        await prisma.message.update({
            where: { id: aiMessage.id },
            data: { 
                content: result.message, 
                isComplete: true 
            },
        });

        // 4. Clean JSON Response
        return NextResponse.json({
            success: true,
            message: result.message,
            actions: result.actions,
        });

    } catch (error) {
        console.error("❌ Orchestrator Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}