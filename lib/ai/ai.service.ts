import { GoogleGenAI } from '@google/genai';

// Initialize the Google Generative AI client
// Ensure GEMINI_API_KEY is available in your .env.local file
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIResponse {
    intent: 'chat' | 'page_update' | 'video_create' | 'animation_create';
    message?: string;
    data?: any;
}

export const processIntent = async (userMessage: string): Promise<AIResponse> => {
    try {
        const response = await ai.models.generateContent({
            // Note: Use gemini-2.5-flash as available
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
            config: {
                systemInstruction: "Classify intent into: 'page_update', 'video_create', 'animation_create', or 'chat'. \n\n'video_create': User explicitly asks to generate/create/make a video using Manim/Python. \n'animation_create': User explicitly asks to generate/create/make an interactive animation/sketch using p5.js/code. \n'page_update': User wants to edit/change/update the content of the current document/page. \n'chat': General conversation or questions. \n\nReturn ONLY JSON.",
                responseMimeType: "application/json",
            }
        });

        // In the @google/genai SDK, text is a PROPERTY, not a function.
        const text = response.text || "";

        console.log("AI Response:", text);

        if (!text) throw new Error("Empty response from AI");

        return JSON.parse(text) as AIResponse;

    } catch (error) {
        console.error("AI Intent Error:", error);
        return {
            intent: 'chat',
            message: "I'm having trouble classifying that. How can I help?",
            data: {}
        };
    }
};
