import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const chatId = req.nextUrl.searchParams.get("chatId");
        if (!chatId) {
            return NextResponse.json({ success: false, message: "chatId required" }, { status: 400 });
        }

        const chat = await prisma.chat.findUnique({
            where: {
                id: chatId,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!chat) {
            return NextResponse.json({ success: false, message: "Chat not found" }, { status: 404 });
        }

        // Verify user owns chat
        if (chat.userId !== userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            data: chat
        });

    } catch (error) {
        console.error("Failed to fetch messages:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch the messages"
        }, { status: 500 });
    }
}
