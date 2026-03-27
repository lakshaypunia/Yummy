// @/app/api/chat/send-message/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AgentOrchestrator } from "../../../../lib/agent/agent.service";
import { runAgent } from "@/lib/agent2/graph";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const { chatId, content, pageId } = await req.json();

        // 1. Persist user message
        await prisma.message.create({
            data: { chatId, role: "USER", content, isComplete: true },
        });

        // 2. Create placeholder AI message
        const aiMessage = await prisma.message.create({
            data: { chatId, role: "SYSTEM", content: "", isComplete: false },
        });

        if (process.env.USE_LANGGRAPH === "true") {

            console.log("agent 2 is working")
            console.log("")
            console.log("")
            console.log("")
            console.log("")
            console.log("")
            console.log("")
            console.log("")
            console.log("")
            console.log("")
            console.log("")
            console.log("")
            await runAgent({
                userMessage: content,
                userId,
                aiMessageId: aiMessage.id,
                pageId
            });

            return NextResponse.json({
                success: true,
                message: "Processed by LangGraph Agent",
                actions: [],
                data: null,
            });
        }

        // 3. Try streaming first (chat + rag intents)
        const stream = await AgentOrchestrator.runStream(content, userId, aiMessage.id, pageId);

        if (stream) {
            // Return the raw text stream — useSendChat's reader will handle it
            return new Response(stream, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Transfer-Encoding": "chunked",
                    "X-Content-Type-Options": "nosniff",
                },
            });
        }

        // 4. Non-streamable intent: run synchronously and return JSON
        const result = await AgentOrchestrator.run(content, userId, aiMessage.id, pageId);

        // Persist final AI message
        await prisma.message.update({
            where: { id: aiMessage.id },
            data: { content: result.message, isComplete: true },
        });

        return NextResponse.json({
            success: true,
            message: result.message,
            actions: result.actions,
            data: result.data,
        });

    } catch (error) {
        console.error("❌ Orchestrator Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}