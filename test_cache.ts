import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
    const testModels = [
        'models/gemini-1.5-pro-002',
        'models/gemini-1.5-flash-002',
        'gemini-1.5-pro-002',
    ];

    const logs: string[] = [];

    for (const m of testModels) {
        try {
            const c = await ai.caches.create({
                model: m,
                contents: [{ role: 'user', parts: [{ text: 'test cache' }] }],
                ttl: "60s"
            });
            logs.push(`SUCCESS with model: ${m} Cache name: ${c.name}`);
        } catch (e: any) {
            logs.push(`FAILED with model: ${m} - Error: ${JSON.stringify(e)} - Message: ${e.message}`);
        }
    }
    
    fs.writeFileSync('cache_test_log.txt', logs.join('\n\n'));
    console.log("Done writing log.");
}
run();
