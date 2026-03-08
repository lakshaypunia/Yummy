import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ai, processIntent } from "@/lib/ai/ai.service";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { chatId, content, pageId } = body;

        if (!chatId || !content) {
            return NextResponse.json({ success: false, message: "chatId and content are required" }, { status: 400 });
        }

        // Verify chat exists and belongs to user
        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat || chat.userId !== userId) {
            return NextResponse.json({ success: false, message: "Chat not found or unauthorized" }, { status: 404 });
        }

        // Save user message
        const userMessage = await prisma.message.create({
            data: {
                chatId,
                role: "USER",
                content,
                isComplete: true,
            },
        });

        // Create placeholder AI message (streamed later)
        const aiMessage = await prisma.message.create({
            data: {
                chatId,
                role: "SYSTEM",
                content: "",
                isComplete: false,
            },
        });

        // Classify user intent
        let intentData;
        try {
            intentData = await processIntent(content);
            console.log("🎯 Detected Intent:", intentData.intent);

            await prisma.message.update({
                where: { id: aiMessage.id },
                data: {
                    metadata: {
                        intent: intentData.intent,
                        intentData: intentData.data || {}
                    }
                }
            });
        } catch (intentError) {
            console.error("⚠️ Intent classification failed, defaulting to chat:", intentError);
            intentData = { intent: 'chat', message: '' };
        }

        // P5 Animation Create (Simplified Port)
        if (intentData.intent === 'animation_create') {
            console.log("🎨 Processing Animation Creation Request");

            try {
                const systemPrompt = `You are an expert creative coder specializing in p5.js.
Return a single HTML string with embedded CSS and JS based on: "${content}".
Use CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.js"></script>
Make canvas fit screen nicely. Provide ONLY the HTML code without markdown formatting blocks.`;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
                });

                let htmlCode = response.text || "";
                htmlCode = htmlCode.replace(/```html/g, '').replace(/```/g, '').trim();

                if (htmlCode) {
                    const animation = await prisma.p5Animation.create({
                        data: {
                            code: htmlCode,
                            userId: userId
                        }
                    });

                    await prisma.message.update({
                        where: { id: aiMessage.id },
                        data: {
                            content: "I've generated the p5.js animation for you. Rendering it now...",
                            isComplete: true,
                            metadata: {
                                intent: intentData.intent,
                                animationId: animation.id
                            }
                        }
                    });

                    return NextResponse.json({
                        success: true,
                        type: "animation_create_success",
                        data: {
                            animationId: animation.id,
                            code: htmlCode,
                            chatId,
                            messageId: aiMessage.id
                        }
                    });
                }
            } catch (err) {
                console.error("Animation generation failed, falling back", err);
                intentData.intent = 'chat';
            }
        }

        // Video Create (Simplified Port)
        if (intentData.intent === 'video_create') {
            console.log("🎥 Processing Video Creation Request");
            try {
                const systemPrompt = `You are a Python Manim expert. Construct Python code to render an animation based on: "${content}". Provide ONLY valid python manim code. No markdown.`;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
                });

                let pythonCode = response.text || "";
                pythonCode = pythonCode.replace(/```python/g, '').replace(/```/g, '').trim();

                if (pythonCode) {
                    await prisma.message.update({
                        where: { id: aiMessage.id },
                        data: {
                            content: "I've generated the Python code for your video. Rendering it now...",
                            isComplete: true,
                            metadata: {
                                intent: intentData.intent,
                                videoCode: pythonCode
                            }
                        }
                    });

                    return NextResponse.json({
                        success: true,
                        type: "video_create_success",
                        data: {
                            code: pythonCode,
                            chatId,
                            messageId: aiMessage.id
                        }
                    });
                }
            } catch (err) {
                console.error("Video code generation failed, falling back", err);
                intentData.intent = 'chat';
            }
        }

        // Setup streaming for standard text Chat
        const encoder = new TextEncoder();
        let fullResponse = "";

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const aiStream = await ai.models.generateContentStream({
                        model: "gemini-2.5-flash",
                        contents: content,
                    });

                    for await (const chunk of aiStream) {
                        const textChunk = chunk.text || "";
                        if (textChunk) {
                            fullResponse += textChunk;
                            controller.enqueue(encoder.encode(textChunk));
                        }
                    }

                    // Save complete message
                    await prisma.message.update({
                        where: { id: aiMessage.id },
                        data: {
                            content: fullResponse,
                            isComplete: true,
                            tokenCount: fullResponse.split(" ").length,
                        },
                    });

                } catch (streamError) {
                    console.error("❌ Stream failed:", streamError);

                    await prisma.message.update({
                        where: { id: aiMessage.id },
                        data: {
                            content: fullResponse,
                            isComplete: false,
                        },
                    });

                    controller.enqueue(encoder.encode("\n[Stream failed or cancelled]"));
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error("❌ Error in SendMessage Route:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, { status: 500 });
    }
}
