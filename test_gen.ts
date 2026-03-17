import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
    const fileUri = "https://generativelanguage.googleapis.com/v1beta/files/qbwlkzljtpw7";

    try {
        console.log("Generating content with gemini-1.5-pro using implicit fileData...");
        const response = await ai.models.generateContent({
            model: "gemini-1.5-pro",
            contents: [
                {
                    role: "user",
                    parts: [
                        { fileData: { fileUri, mimeType: "application/pdf" } },
                        { text: "Summarize this document" }
                    ]
                }
            ],
            config: {
                systemInstruction: "You are an expert file analyzer."
            }
        });
        console.log("SUCCESS:", response.text);
    } catch (e: any) {
        console.error("FAILED model: gemini-1.5-pro", "Error:", e.message);
    }
}
run();
