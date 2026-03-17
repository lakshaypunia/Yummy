// @/lib/ai/agent.service.ts
import { ai } from "../ai/ai.service";
import { prisma } from "@/lib/prisma";


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
   * Main Execution Entry Point
   */
  static async run(content: string, userId: string, aiMessageId: string) {
    console.log("🧠 Brain identifying tasks based on tags...");
    
    // 1. IDENTIFY
    // Commenting out the multi-intent identifier for now
    // const plan = await this.identifyMultiIntent(content);
    
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
    }

    const payload = {
      topic: cleanContent,
      content: cleanContent,
      query: cleanContent,
      instructions: cleanContent,
    };

    let result;

    // 2. EXECUTE BASED ON TAG
    try {
      switch (actionType) {
        case 'animation_create': 
          result = await this.handleAnimation(payload, userId);
          break;
        case 'video_create': 
          result = await this.handleVideo(payload);
          break;
        case 'page_update': 
          result = await this.handlePageUpdate(payload);
          break;
        case 'diagram_create': 
          result = await this.handleDiagram(payload);
          break;
        case 'chat': 
        default: 
          result = { status: 'ready', message: cleanContent };
          break;
      }
    } catch (err) {
      console.error(`Task ${actionType} failed:`, err);
      result = { type: actionType, error: true };
    }

    // 3. FINALIZE DB RECORD

    return {
      message: actionType === 'chat' ? cleanContent : `Processing ${actionType} intent`,
      actions: [{ type: actionType as any, payload }],
      data: [result]
    };
  }

  // Helper Stubs
  private static async handleAnimation(payload: any, userId: string) { return { type: 'p5' }; }
  private static async handleVideo(payload: any) { return { type: 'manim' }; }
  private static async handlePageUpdate(payload: any) { return { type: 'blocknote' }; }
  private static async handleDiagram(payload: any) { return { type: 'mermaid' }; }
}