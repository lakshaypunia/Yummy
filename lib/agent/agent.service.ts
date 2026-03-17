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
  static async run(content: string, userId: string, aiMessageId: string, pageId?: string) {
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
      pageId // Pass pageId down into the payload
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
          result = await this.handlePageUpdate(payload, userId);
          break;
        case 'diagram_create': 
          result = await this.handleDiagram(payload);
          break;
        case 'chat': 
        default: 
          result = await this.handleChat(payload);
          break;
      }
    } catch (err) {
      console.error(`Task ${actionType} failed:`, err);
      result = { type: actionType, error: true };
    }

    // 3. FINALIZE DB RECORD

    return {
      message: actionType === 'chat' ? ((result as any).message || cleanContent) : `Processing ${actionType} intent`,
      actions: [{ type: actionType as any, payload }],
      data: [result]
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

  // Handlers for specific intents
  private static async handleAnimation(payload: any, userId: string) { 
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: payload.content }] }],
        config: {
          systemInstruction: "You are an expert p5.js developer. Generate valid p5.js code based on the user's request. Output ONLY the raw p5.js code, no markdown fencing, no explanations, no HTML. Just the javascript code for the sketch."
        }
      });
      return { type: 'p5', status: 'ready', content: response.text }; 
    } catch (error) {
      console.error("Animation Error:", error);
      return { type: 'p5', status: 'error', content: "Failed to generate animation" };
    }
  }

  private static async handleVideo(payload: any) { 
    try {
      // Step 1: Refine the prompt to expand on creativity and strict constraints
      const refineSystemPrompt = `
        You are an expert prompt engineer specializing in creative coding ('Manim/Python'}).
        Your goal is to take a simple user request and expand it into a DETAILED, high-quality prompt that will be used by another AI to generate the actual code.

        Detailed Requirements for the Expanded Prompt:
        1. **Clarity & Detail**: Expand concepts, describe visual elements, animations, and behaviors in depth.
        2. **Resource Efficiency**: 
           - **CRITICAL**: Keep the visualization efficient to avoid timeouts. 
           - **Maximum Animations**: Limit the total number of animations to **20 or fewer**.
           - **3D Geometry**: Avoid high-resolution 3D objects. If using \`Sphere\`, explicitly set low resolution (e.g., \`resolution=(12, 12)\`) or use \`Dot\` if possible. Avoid rendering hundreds of complex objects simultaneously.
        3. **Aesthetics & Colors**: Suggest a modern, professional color palette. 
           - **CRITICAL**: Suggest colors using HEX CODES (e.g., #007bff) or very standard names (e.g., "blue", "red"). 
           - **Avoid** names like "light blue" or "dark grey" which might not be defined as constants in the target library.
        4. **Interactivity (for p5.js)**: Explicitly mention how users should be able to interact (mouse, keyboard).
        5. **No Code**: Do NOT generate any code. Only text describing the scene/animation.
        6. **Technical Constraints**: 
           - Explicitly state that the code generator must use standard, built-in constants and avoid guessing variable names for colors.
           - **For Manim**: 
             - Warn that \`Text\` mobjects do **NOT** accept \`text_align\` as a constructor argument.
             - **CRITICAL**: Do **NOT** call \`obj.fix_in_frame()\`. In \`ThreeDScene\`, use \`self.add_fixed_in_frame_mobjects(obj)\` instead.
             - **Camera Control**: Do **NOT** use \`Rotate()\` on camera attributes like \`phi\` or \`theta\`. Use \`self.move_camera(phi=..., theta=...)\` for camera orientation animations.
             - **Rotations**: Strictly use \`about_point=...\` (NOT \`about_pt=\`) when specifying the rotation center for any mobject.

        Structure your output as a single, cohesive paragraph or a list of specific instructions for the specialized code-generating AI.
        `;
      
      const refinedResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: payload.content }] }],
        config: { systemInstruction: refineSystemPrompt }
      });

      const detailedPrompt = refinedResponse.text || payload.content;

      // Step 2: Generate the Manim code
      const manimSystemPrompt = `
        You are an expert Python developer specializing in Manim (Community Edition).
        Your task is to write a complete, runnable Python script using Manim to visualize the user's request.

        Description of requested video: "${detailedPrompt}"

        Rules:
        1.  **Imports**: Always start with \`from manim import *\`. Import \`numpy as np\` if needed.
        2.  **Class Name**: Define a class named \`VideoScene\` that inherits from \`Scene\`.
        3.  **Construct Method**: Implement the \`construct(self)\` method.
        4.  **Content**: 
            - Create clear, educational visualizations.
            - Use \`Text\`, \`MathTex\`, \`Circle\`, \`Square\`, \`Create\`, \`FadeIn\`, \`FadeOut\`, \`Transform\`, etc.
            - Ensure animations are smooth and well-timed (use \`self.wait()\`).
            - Keep the total runtime reasonable (10-30 seconds).
        5.  **Output**: Return ONLY the Python code. Do not include markdown formatting like \`\`\`python ... \`\`\`.
        6.  **Error Handling**: Ensure the code is syntactically correct and uses valid Manim Community v0.17+ syntax.
        7.  **Assets**: Do NOT use any external files (images, SVGs, sounds). Use only built-in Manim shapes (Circle, Square, etc) and text.
        8.  **Colors**: 
            - Use standard Manim color constants (e.g., \`BLUE\`, \`RED\`, \`WHITE\`, \`YELLOW\`, \`GREEN\`, \`ORANGE\`, \`PURPLE\`, \`PINK\`, \`TEAL\`, \`GOLD\`, \`MAROON\`, \`SCARLET\`).
            - **NEVER** use names like \`LIGHT_BLUE\`, \`DARK_GREY\`, or any other guessed color names.
            - If you need a specific shade, define it with a Hex code: \`S_COLOR = "#ADD8E6"\`.
        9.  **Library Defaults**: Stick to standard \`Scene\` or \`ThreeDScene\` methods. Do not assume existence of unimported utilities.
        10. **Text Alignment**: 
            - **CRITICAL**: The \`Text\` class does **NOT** accept a \`text_align\` argument. 
            - To align text, use \`Tex\` with \`alignment\` (e.g., \`Tex("...", alignment="\\\\\\RaggedRight")\`) or manually position mobjects using \`obj.next_to(other_obj, DOWN)\`.
            - Ensure all keyword arguments passed to \`Text\`, \`Tex\`, or \`Circle\` are valid per Manim Community standards.
        11. **3D Scenes**:
            - If using \`ThreeDScene\`, do **NOT** call \`obj.fix_in_frame()\`. This method does not exist on mobjects.
            - Instead, use \`self.add_fixed_in_frame_mobjects(obj)\` to keep UI elements or text fixed relative to the camera.
        12. **Camera Rotation & Movement**:
            - **CRITICAL**: Do **NOT** use \`self.camera.animate\`. This will cause an AttributeError.
            - **CRITICAL**: Do **NOT** use \`Rotate(self.camera.phi, ...)\` or \`Rotate(self.camera.theta, ...)\`.
            - To animate camera movement/rotation, use \`self.move_camera(phi=NEW_PHI, theta=NEW_THETA, focal_distance=..., run_time=...)\`.
            - To start a continuous rotation, use \`self.begin_ambient_camera_rotation(rate=...)\`.
        13. **Rotation Arguments**:
            - **CRITICAL**: The keyword argument for specifying a rotation center is \`about_point\`. 
            - **NEVER** use \`about_pt\`, as this will cause a \`TypeError\`.
        14. **Performance & Complexity**:
            - **CRITICAL**: Keep the scene simple to ensure it renders within 5 minutes.
            - **Animations**: Stick to standard animations: \`Create\`, \`Uncreate\`, \`FadeIn\`, \`FadeOut\`, \`Write\`, \`Transform\`, \`ReplacementTransform\`. 
            - **NEVER** use hallucinated composite animations like \`ShrinkAndFadeOut\`.
            - **Limit Objects**: Do not create or animate more than 15-20 mobjects in a single scene.
            - **Sphere Resolution**: If using \`Sphere\`, **ALWAYS** use low resolution: \`Sphere(radius=..., resolution=(12, 12))\`. Default resolution is too high and will cause timeouts.
            - **Limit Transforms**: Avoid complex \`Transform\` or \`ReplacementTransform\` on high-resolution geometry.
        15. **Positioning Constants**:
            - **CRITICAL**: Use only standard Manim direction constants: \`UP\`, \`DOWN\`, \`LEFT\`, \`RIGHT\`, \`ORIGIN\`, \`IN\`, \`OUT\`, \`UL\`, \`UR\`, \`DL\`, \`DR\`.
            - **NEVER** use \`TOP\` or \`BOTTOM\`. Use \`UP\` or \`DOWN\` instead (e.g., \`obj.to_edge(UP)\`).
            - **NEVER** use \`CENTER\`. Use \`ORIGIN\` if you mean the center of the scene.

        Example Structure:
        from manim import *

        class VideoScene(Scene):
            def construct(self):
                t = Text("Hello World")
                self.play(Write(t))
                self.wait()
        `;

      const codeResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: manimSystemPrompt }] }]
      });

      let rawCode = codeResponse.text || "";
      rawCode = rawCode.replace(/```python/g, '').replace(/```/g, '').trim();

      // IMPORTANT: In useStreamingChat, we look for `video_create_success` inside `jsonData.type`
      return { type: 'video_create_success', status: 'ready', data: rawCode }; 
    } catch (error) {
      console.error("Video Error:", error);
      return { type: 'video_create', status: 'error', data: "Failed to generate video" };
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
      const prompt = `
        The user wants to update their document: "${payload.content}"
        
        Here is the current JSON array of BlockNote blocks:
        ${JSON.stringify(currentBlocks, null, 2)}
        
        Analyze the blocks and return a JSON array containing ONLY the updates needed. 
        Each update object should look like this:
        {
           "targetBlockId": "the-id-of-the-block-to-update",
           "originalType": "the-original-block-type-like-paragraph",
           "originalContent": "the original text content of the block",
           "newType": "the requested block type (e.g. 'heading', 'paragraph', 'bulletListItem')",
           "newProps": {"level": 1}, // JSON object combining original props with NEW requested styling props (like 'level' for headings, 'textColor', 'textAlignment', etc.)
           "newContent": "the requested new text content for the block",
           "explanation": "Short explanation of why this was changed including the styling changes"
        }

        Return ONLY a JSON array of these objects, no markdown formatting.
      `;

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
      const syncServerUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "ws://localhost:3000";
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

  private static async handleDiagram(payload: any) { 
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: payload.content }] }],
        config: {
          systemInstruction: "You are an expert Mermaid.js developer. Generate valid Mermaid diagram code based on the user's request. Output ONLY the raw mermaid code, no markdown fencing, no explanations."
        }
      });
      return { type: 'mermaid', status: 'ready', content: response.text }; 
    } catch (error) {
      console.error("Diagram Error:", error);
      return { type: 'mermaid', status: 'error', content: "Failed to generate diagram" };
    }
  }
}