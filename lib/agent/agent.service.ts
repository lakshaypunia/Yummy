// @/lib/ai/agent.service.ts
import { ai } from "../ai/ai.service";
import { prisma } from "@/lib/prisma";
import { manimCode, mermaidCode } from "../video";


export interface AIAction {
  type: 'chat' | 'page_update' | 'video_create' | 'animation_create' | 'doc_search' | 'diagram_create';
  payload: {
    topic?: string;
    content?: string;
    query?: string;
    instructions?: string;
  };
  reasoning?: string;
}

// The overall structure the Supervisor Brain returns
export interface AIResponse {
  intent: 'chat' | 'page_update' | 'video_create' | 'animation_create';
  message: string; // The text summary for the chat window
  actions: AIAction[]; // Parallel tasks to execute
}

export class AgentOrchestrator {
  private static async broadcastBlocks(pageId: string, blocks: any[], userId?: string) {
    const syncServerUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "ws://localhost:3000";
    const broadcastHttpUrl = syncServerUrl.replace("ws://", "http://").replace("wss://", "https://") + "/api/broadcast";
    try {
      await fetch(broadcastHttpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          event: { type: 'ai-update', userId, blocks }
        })
      });
    } catch (err) {
      console.error("Failed to broadcast AI update", err);
    }
  }

  private static async appendBlock(pageId: string, newBlock: any) {
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page || !page.blockJson) throw new Error("Page not found");
    const currentBlocks = page.blockJson as any[];
    const newBlocks = [...currentBlocks, newBlock];
    await prisma.page.update({ where: { id: pageId }, data: { blockJson: newBlocks as any } });
    return newBlocks;
  }

  /**
   * Internal "Brain" function: Identifies all required intents.
   * Fixed for @google/genai syntax.
   */
  private static async identifyMultiIntent(content: string): Promise<AIResponse> {
    try {
      // Use the generativeModel property or the direct generateContent approach 
      // depending on your specific version. Usually it is:
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: content }] }],
        config: {
          systemInstruction: `
                    You are the "Multi-Task Intent Identifier".
                    Analyze the query and plan a set of parallel actions.
                    Return ONLY JSON matching the AIResponse interface.

                    HEURISTICS:
                    - COMPLEXITY: Add 'video_create' for technical/science topics.
                    - STRUCTURE: Add 'diagram_create' for systems.
                    - CONTENT: Add 'page_update' for learning/summarizing.
                    - ALWAYS: Include a 'chat' action in PAST TENSE.
                `,
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "";
      return JSON.parse(text) as AIResponse;
    } catch (error) {
      console.error("Brain Identification Error:", error);
      throw error;
    }
  }

  /**
   * Determines if the intent should be streamed.
   * Returns the clean content + action type without executing.
   */
  static parseIntent(content: string): { actionType: string; cleanContent: string } {
    let actionType = 'chat';
    let cleanContent = content;

    if (content.includes('@update')) {
      actionType = 'page_update';
      cleanContent = content.replace('@update', '').trim();
    } else if (content.includes('@video')) {
      actionType = 'video_create';
      cleanContent = content.replace('@video', '').trim();
    } else if (content.includes('@animation')) {
      actionType = 'animation_create';
      cleanContent = content.replace('@animation', '').trim();
    } else if (content.includes('@diagram')) {
      actionType = 'diagram_create';
      cleanContent = content.replace('@diagram', '').trim();
    } else if (content.includes('@p5')) {
      actionType = 'p5_create';
      cleanContent = content.replace('@p5', '').trim();
    } else if (content.includes('@react-flow')) {
      actionType = 'react_flow_create';
      cleanContent = content.replace('@react-flow', '').trim();
    } else if (content.includes('@rag')) {
      actionType = 'rag_create';
      cleanContent = content.replace('@rag', '').trim();
    } else if (content.includes('@desmos')) {
      actionType = 'desmos_create';
      cleanContent = content.replace('@desmos', '').trim();
    }

    return { actionType, cleanContent };
  }

  /**
   * Returns a ReadableStream for streamable intents (chat, rag_create).
   * Returns null for non-streamable intents — caller should use run() instead.
   * The stream also handles the DB write-back via the accumulated text.
   */
  static async runStream(
    content: string,
    userId: string,
    aiMessageId: string,
    pageId?: string
  ): Promise<ReadableStream<Uint8Array> | null> {
    const { actionType, cleanContent } = this.parseIntent(content);

    // Only these two intents get streamed
    if (actionType !== 'chat' && actionType !== 'rag_create') return null;

    const payload = { content: cleanContent, pageId };
    const encoder = new TextEncoder();
    let accumulated = '';

    if (actionType === 'chat') {
      const genStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: cleanContent }] }],
        config: {
          systemInstruction: 'You are a helpful AI assistant. Answer the user\'s query clearly.',
        },
      });

      return new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const chunk of genStream) {
              const text = chunk.text ?? '';
              if (text) {
                accumulated += text;
                controller.enqueue(encoder.encode(text));
              }
            }
          } catch (err) {
            console.error('Chat stream error:', err);
          } finally {
            // Persist final message to DB BEFORE closing so refetch() sees the complete row
            try {
              await prisma.message.update({
                where: { id: aiMessageId },
                data: { content: accumulated, isComplete: true },
              });
            } catch (e: any) {
              console.error('DB update error:', e);
            }
            controller.close();
          }
        },
      });
    }

    // rag_create
    // We need to resolve the page first (async), then stream
    const page = await prisma.page.findUnique({ where: { id: pageId! } });
    // @ts-ignore
    if (!page || !page.geminiFileUri) {
      // Not streamable — return null and let run() handle the error message
      return null;
    }

    // @ts-ignore
    let contentParts: any[] = [{ fileData: { fileUri: page.geminiFileUri, mimeType: 'application/pdf' } }, { text: cleanContent }];
    let reqConfig: any = { systemInstruction: "You are an expert assistant. Answer the user's query based ONLY on the attached cached document. If the answer is not in the document, reply that you don't know." };
    // @ts-ignore
    if (page.geminiCacheName) {
      // @ts-ignore
      reqConfig.cachedContent = page.geminiCacheName;
      contentParts = [{ text: cleanContent }];
    }

    const ragStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: contentParts }],
      config: reqConfig,
    });

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of ragStream) {
            const text = chunk.text ?? '';
            if (text) {
              accumulated += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error('RAG stream error:', err);
        } finally {
          // Persist BEFORE closing so refetch() sees the complete row
          try {
            await prisma.message.update({
              where: { id: aiMessageId },
              data: { content: accumulated, isComplete: true },
            });
          } catch (e: any) {
            console.error('DB update error:', e);
          }
          controller.close();

          // Log metrics (fire-and-forget is fine here)
          const fs = require('fs');
          const path = require('path');
          const metricsLog = `--- RAG Query ---\nTimestamp: ${new Date().toISOString()}\nQuery: ${cleanContent}\nApprox chars: ${accumulated.length}\n\n`;
          fs.appendFileSync(path.join(process.cwd(), 'matrix.txt'), metricsLog);
        }
      },
    });
  }

  /**
   * Main Execution Entry Point (non-streaming intents only)
   */
  static async run(content: string, userId: string, aiMessageId: string, pageId?: string) {
    console.log('🧠 Brain identifying tasks based on tags...');

    const { actionType, cleanContent } = this.parseIntent(content);

    const payload = {
      topic: cleanContent,
      content: cleanContent,
      query: cleanContent,
      instructions: cleanContent,
      pageId,
    };

    let result;

    try {
      switch (actionType) {
        case 'animation_create':
          result = await this.handleAnimation(payload, userId);
          break;
        case 'video_create':
          result = await this.handleVideo(payload, userId);
          break;
        case 'page_update':
          result = await this.handlePageUpdate(payload, userId);
          break;
        case 'diagram_create':
          result = await this.handleDiagram(payload, userId);
          break;
        case 'p5_create':
          result = await this.handleP5(payload, userId);
          break;
        case 'react_flow_create':
          result = await this.handleReactFlow(payload, userId);
          break;
        case 'rag_create':
          // Fallback for when runStream() returned null (no PDF attached)
          result = await this.handleRag(payload);
          break;
        case 'desmos_create':
          result = await this.handleDesmos(payload, userId);
          break;
        case 'chat':
        default:
          // Fallback non-streaming chat (shouldn't normally reach here)
          result = await this.handleChat(payload);
          break;
      }
    } catch (err) {
      console.error(`Task ${actionType} failed:`, err);
      result = { type: actionType, error: true };
    }

    return {
      message: (result as any)?.message || `Processing ${actionType} intent`,
      actions: [{ type: actionType as any, payload }],
      data: [result],
    };
  }

  private static async handleChat(payload: any) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: payload.content }] }],
        config: {
          systemInstruction: "You are a helpful AI assistant. Answer the user's query clearly."
        }
      });
      return { status: 'ready', message: response.text };
    } catch (error) {
      console.error("Chat Error:", error);
      return { status: 'error', message: "Failed to generate chat response" };
    }
  }

  private static async handleAnimation(payload: any, userId: string) {
    return { type: 'animation_create', status: 'error', message: 'Not implemented' };
  }

  private static async handleP5(payload: any, userId?: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: payload.content }] }],
        config: {
          systemInstruction: `You are an expert p5.js developer. Generate an interactive p5.js sketch based on the user's request. 
          Output MUST be a complete, self-contained HTML file snippet containing the CDNs and script tags ready to be embedded in an iframe.
          Do NOT include markdown fencing like \`\`\`html. Return ONLY the raw HTML string.`
        }
      });
      let rawHtml = response.text || "";
      rawHtml = rawHtml.replace(/```html/g, '').replace(/```/g, '').trim();
      
      if (!payload.pageId) throw new Error("No pageId provided");
      
      const newBlock = {
        id: `p5-${Date.now()}`,
        type: "p5",
        props: { code: rawHtml },
        content: []
      };
      
      const newBlocks = await this.appendBlock(payload.pageId, newBlock);
      await this.broadcastBlocks(payload.pageId, newBlocks, userId);

      return { type: 'p5_create_success', status: 'ready', data: rawHtml, message: "I've added the p5.js sketch to the page!" };
    } catch (error) {
      console.error("p5 Error:", error);
      return { type: 'p5_create', status: 'error', data: "Failed to generate p5.js sketch" };
    }
  }

  private static async handleReactFlow(payload: any, userId?: string) {
    console.log("⚛️ Using hardcoded ReactFlow nodes/edges (no AI call)");
    const hardcodedFlow = {
      nodes: [
        { id: '1', position: { x: 250, y: 50 }, data: { label: 'AVL Tree Root (30)' } },
        { id: '2', position: { x: 100, y: 200 }, data: { label: 'Left Child (20)' } },
        { id: '3', position: { x: 400, y: 200 }, data: { label: 'Right Child (40)' } },
        { id: '4', position: { x: 25, y: 350 }, data: { label: 'LL (10)' } },
        { id: '5', position: { x: 175, y: 350 }, data: { label: 'LR (25)' } },
        { id: '6', position: { x: 325, y: 350 }, data: { label: 'RL (35)' } },
        { id: '7', position: { x: 475, y: 350 }, data: { label: 'RR (50)' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e2-5', source: '2', target: '5' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e3-7', source: '3', target: '7' },
      ]
    };
    
    if (payload.pageId) {
      const newBlock = {
        id: `react-flow-${Date.now()}`,
        type: "react-flow",
        props: {
          nodes: JSON.stringify(hardcodedFlow.nodes),
          edges: JSON.stringify(hardcodedFlow.edges)
        },
        content: []
      };
      
      const newBlocks = await this.appendBlock(payload.pageId, newBlock);
      await this.broadcastBlocks(payload.pageId, newBlocks, userId);
    }
    
    return { type: 'react_flow_create_success', status: 'ready', data: hardcodedFlow, message: "I've added the flow diagram." };
  }

  private static async handleDesmos(payload: any, userId?: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: payload.content }] }],
        config: {
          systemInstruction: `You are an expert math teacher and Desmos power user. Generate a list of Desmos calculator expressions based on the user's request.

CRITICAL RULES FOR DESMOS LATEX:
1. NEVER use the raw '|' (pipe) symbol. It causes parsing errors.
2. Domain/Range Restrictions: Use curly braces. Do NOT use '|' or ':' as separators. 
   - Correct: y = x^2 \\{x > 0\\}
   - Incorrect: y = x^2 | x > 0
3. Absolute Values: Use \\operatorname{abs}(x) or \\left| x \\right|.
4. JSON Escaping: You MUST double-escape all LaTeX backslashes so the output is valid JSON. (e.g., use \\\\frac{1}{2} instead of \\frac{1}{2}, and \\\\{x > 0\\\\} instead of \\{x > 0\\}).

OUTPUT FORMAT:
You must return ONLY a JSON array of objects.
Each object must represent a Desmos expression with this exact format:
{ "id": "graph1", "latex": "y = x^2", "color": "#c74440", "hidden": false }

Do NOT include markdown fencing. Return ONLY a raw, parseable JSON array.`,
          responseMimeType: "application/json"
        }
      });
      let expressions;
      try {
        expressions = JSON.parse(response.text || '[]');
      } catch (e) {
        throw new Error("Failed to parse Desmos expressions JSON");
      }
      
      if (payload.pageId) {
        const newBlock = {
          id: `desmos-${Date.now()}`,
          type: "desmos",
          props: { equations: JSON.stringify(expressions) },
          content: []
        };
        
        const newBlocks = await this.appendBlock(payload.pageId, newBlock);
        await this.broadcastBlocks(payload.pageId, newBlocks, userId);
      }
      
      return { type: 'desmos_create_success', status: 'ready', data: expressions, message: `Here's your Desmos graph! I've added ${expressions.length} expression${expressions.length !== 1 ? 's' : ''} to the graphing calculator.` };
    } catch (error) {
      console.error("Desmos Error:", error);
      return { type: 'desmos_create', status: 'error', data: "Failed to generate Desmos equations" };
    }
  }

  private static async handleVideo(payload: any, userId?: string) {
    console.log("🎬 Orchestrating video creation on backend");
    
    if (!payload.pageId) return { type: 'video_create', status: 'error', message: 'No page specified' };
    
    try {
      // 1. Generate video via sync-server API
      const syncServerUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "ws://localhost:3000";
      const apiUrl = syncServerUrl.replace("ws://", "http://").replace("wss://", "https://") + "/api/generate-video";

      const response = await fetch(apiUrl, {     
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: manimCode }),
      });

      if (!response.ok) throw new Error("Failed to generate video on server");

      const blob = await response.blob();
      const videoFile = new File([blob], "ai-video.mp4", { type: "video/mp4" });
      
      // 2. Upload using UTApi
      const { UTApi } = await import("uploadthing/server");
      const utapi = new UTApi();
      const uploadResponse = await utapi.uploadFiles([videoFile]);
      const url = uploadResponse[0].data?.url;

      if (!url) throw new Error("Upload failed");

      // 3. Update DB & Broadcast
      const newBlock = {
        id: `video-${Date.now()}`,
        type: "video",
        props: { url },
        content: []
      };
      
      const newBlocks = await this.appendBlock(payload.pageId, newBlock);
      await this.broadcastBlocks(payload.pageId, newBlocks, userId);
      
      return { type: 'video_create_success', status: 'ready', message: "Video generated and added to the page!" };
    } catch (e) {
      console.error("Video backend error", e);
      return { type: 'video_create_success', status: 'ready', message: "Failed to generate video." };
    }
  }

  private static async handlePageUpdate(payload: any, userId: string) {
    if (!payload.pageId) {
      return { type: 'blocknote', status: 'error', message: "No active page found. Please open a page to update." };
    }

    try {
      // 1. Fetch current blocks
      const page = await prisma.page.findUnique({ where: { id: payload.pageId } });
      if (!page || !page.blockJson) {
        throw new Error("Page not found or empty.");
      }

      const currentBlocks = page.blockJson as any[];

      // 2. Ask Gemini for changes
      const prompt = `The user wants to perform an action on their document. 

USER REQUEST: "${payload.content}"

CURRENT DOCUMENT STATE (JSON array of BlockNote blocks):
${JSON.stringify(currentBlocks, null, 2)}

TASK:
1.  **Analyze Intent**: Determine if the user is asking to UPDATE specific existing content or EXPLAIN/GENERATE new detailed content.
2.  **Structure the Response**: If explaining a concept, do not return a single block. Use a logical structure including headings (h1, h2, h3), paragraphs, and bulletListItem blocks to make the explanation clear.
3.  **Mapping Updates**: 
    - For existing blocks being modified, provide the 'targetBlockId'.
    - For NEW blocks being created to satisfy an explanation or expansion, use the ID "NEW_BLOCK_[index]" and specify where it should logically go.

Return ONLY a JSON array of update/creation objects. Each object must follow this schema:
{
    "targetBlockId": "the-id-of-the-existing-block-OR-new-id",
    "action": "update" | "insert_after" | "insert_before",
    "newType": "heading" | "paragraph" | "bulletListItem" | "numberedListItem",
    "newProps": { "level": 1, "textColor": "default", "backgroundColor": "default", "textAlignment": "left" },
    "newContent": "the text content",
    "explanation": "Reason for this block creation or change"
}

Ensure the output is a raw JSON array. No markdown code blocks, no preamble, and no conversational text.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });

      // 3. Parse Gemini output
      let updates: any[] = [];
      try {
        updates = JSON.parse(response.text || "[]");
      } catch (e) {
        console.error("Failed to parse Gemini update response:", e);
        throw new Error("Invalid format returned by AI.");
      }

      if (updates.length === 0) {
        return { type: 'blocknote', status: 'ready', message: "AI decided no changes were necessary based on your request." };
      }

      // 4. Create the new blocks array by replacing targeted blocks with ai_update_suggestion blocks
      const newBlocks = currentBlocks.map(block => {
        const update = updates.find(u => u.targetBlockId === block.id);
        if (update) {
          return {
            id: block.id,
            type: "ai_update_suggestion",
            props: {
              originalType: update.originalType || block.type,
              originalContent: update.originalContent || "",
              newType: update.newType || block.type,
              newProps: update.newProps ? JSON.stringify(update.newProps) : JSON.stringify(block.props || {}),
              newContent: update.newContent || "",
              targetBlockId: update.targetBlockId || block.id,
              explanation: update.explanation || "Updated by AI"
            },
            content: [] // Custom blocks usually don't have rich text children
          };
        }
        return block;
      });

      // 5. Save back to PostgreSQL
      await prisma.page.update({
        where: { id: payload.pageId },
        data: { blockJson: newBlocks as any }
      });

      // 6. Broadcast via WebSockets
      const syncServerUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "ws://localhost:1234";
      // Ensure we hit the HTTP broadcast endpoint, not the WS connection
      const broadcastHttpUrl = syncServerUrl.replace("ws://", "http://").replace("wss://", "https://") + "/api/broadcast";

      try {
        await fetch(broadcastHttpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: payload.pageId,
            event: {
              type: 'ai-update',
              userId: userId, // Pass initiating user so only their client executes it
              blocks: newBlocks
            }
          })
        });
      } catch (broadcastErr) {
        console.error("Failed to broadcast AI update to sync-server:", broadcastErr);
        // It's okay if it fails, they can refresh to see it from the DB
      }

      return { type: 'blocknote', status: 'ready', message: "I've suggested updates on the page. Please review them." };
    } catch (error) {
      console.error("Page Update Error:", error);
      return { type: 'blocknote', status: 'error', message: "Failed to generate page update" };
    }
  }

  private static async handleDiagram(payload: any, userId?: string) {
    console.log("📊 Using hardcoded Mermaid diagram (no AI call)");
    try {
      if (payload.pageId) {
        const { parseMermaidToExcalidraw } = await import("@excalidraw/mermaid-to-excalidraw");
        const { elements, files } = await parseMermaidToExcalidraw(mermaidCode);
        
        const newBlock = {
            id: `diagram-${Date.now()}`,
            type: "diagram",
            props: {
                elements: JSON.stringify(elements),
                files: files ? JSON.stringify(files) : null
            },
            content: []
        };
        
        const newBlocks = await this.appendBlock(payload.pageId, newBlock);
        await this.broadcastBlocks(payload.pageId, newBlocks, userId);
      }
      return { type: 'diagram_create_success', status: 'ready', data: mermaidCode, message: "I've added the diagram!" };
    } catch (e) {
      console.error("Diagram error", e);
      return { type: 'diagram_create_success', status: 'ready', message: "Failed to parse diagram on server." };
    }
  }

  private static async handleRag(payload: any) {
    try {
      if (!payload.pageId) {
        return { type: 'chat', status: 'error', message: "No active page found." };
      }

      const page = await prisma.page.findUnique({ where: { id: payload.pageId } });
      // @ts-ignore
      if (!page || !page.geminiFileUri) {
        // Return a helpful message so the user knows they need to attach a PDF first.
        return { type: 'chat', status: 'ready', message: "I couldn't find an attached PDF Document for this page! Please attach a document first using the knowledge base." };
      }

      let contentParts: any[] = [
        // @ts-ignore
        { fileData: { fileUri: page.geminiFileUri, mimeType: "application/pdf" } },
        { text: payload.content }
      ];

      let reqConfig: any = {
        systemInstruction: "You are an expert assistant. Answer the user's query based ONLY on the attached cached document. If the answer is not in the document, reply that you don't know.",
      };

      // @ts-ignore
      if (page.geminiCacheName) {
        // @ts-ignore
        reqConfig.cachedContent = page.geminiCacheName;

        // If using the explicit Cache API, the file data shouldn't be re-passed in the contents array.
        contentParts = [{ text: payload.content }];
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: contentParts }],
        config: reqConfig
      });

      const answer = response.text || "";
      const usageMetadata = response.usageMetadata;

      const metricsLog = `--- RAG Query ---\nTimestamp: ${new Date().toISOString()}\nQuery: ${payload.content}\nCached Tokens: ${usageMetadata?.cachedContentTokenCount || 0}\nPrompt Tokens: ${usageMetadata?.promptTokenCount || 0}\nCandidates Tokens: ${usageMetadata?.candidatesTokenCount || 0}\nTotal Tokens: ${usageMetadata?.totalTokenCount || 0}\n\n`;

      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'matrix.txt');
      fs.appendFileSync(logPath, metricsLog);

      console.log("[RAG] Wrote matrix checker tokens to matrix.txt");

      return { type: 'rag_create_success', status: 'ready', data: answer, message: answer };
    } catch (error) {
      console.error("RAG Error:", error);
      return { type: 'rag_create', status: 'error', data: "Failed to query the cached document." };
    }
  }
}