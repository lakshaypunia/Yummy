import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
    const fileUri = "https://generativelanguage.googleapis.com/v1beta/files/qbwlkzljtpw7";

    try {
        console.log("Generating with gemini-2.5-flash...");
        let response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { fileData: { fileUri, mimeType: "application/pdf" } },
                        { text: "Summarize this document" }
                    ]
                }
            ]
        });
        console.log("SUCCESS 2.5-flash:", response.text);
    } catch (e: any) {
        console.error("FAILED model: gemini-2.5-flash", "Error:", e.message);
    }

    try {
        console.log("\nGenerating with gemini-1.5-flash...");
        let response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { fileData: { fileUri, mimeType: "application/pdf" } },
                        { text: "Summarize this document" }
                    ]
                }
            ]
        });
        console.log("SUCCESS 1.5-flash:", response.text);
    } catch (e: any) {
        console.error("FAILED model: gemini-1.5-flash", "Error:", e.message);
    }
}
run();
