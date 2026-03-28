import { ai } from '@/lib/ai/ai.service';
import { YoutubeTranscript } from 'youtube-transcript';

export async function generateTranscript(input: { url: string, type: 'youtube' | 'upload' }) {
    console.log(`[Agent Tools - generateTranscript] Generating transcript for ${input.type} url: ${input.url}`);
    
    if (input.type === 'youtube') {
        try {
            const transcriptArray = await YoutubeTranscript.fetchTranscript(input.url);
            const transcript = transcriptArray.map(t => t.text).join(' ');
            return transcript;
        } catch (err: any) {
            console.warn(`[Agent Tools - generateTranscript] YoutubeTranscript error: ${err.message}. Falling back to AI model parsing.`);
            
            // Fallback: Ask Gemini to generate the transcript based on the URL (Gemini natively parses some YouTube URLs or relies on web grounding/memory)
            try {
                const geminiResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: `We cannot fetch the transcript natively for this YouTube video. Could you please analyze it and provide a very detailed transcript, summary, or comprehensive notes based on its URL? URL: ${input.url}` },
                            ]
                        }
                    ]
                });
                
                return geminiResponse.text || "No transcript generated.";
            } catch (fallbackErr: any) {
                console.error("[Agent Tools - generateTranscript] AI Fallback error:", fallbackErr);
                throw new Error(`Failed to fetch YouTube transcript and AI fallback also failed: ${err.message}`);
            }
        }
    } else if (input.type === 'upload') {
        try {
            // Check if it's a valid url
            const response = await fetch(input.url);
            if (!response.ok) {
                throw new Error(`Failed to fetch uploaded video: ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');
            const mimeType = response.headers.get('content-type') || 'video/mp4';

            const geminiResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: "Please provide a detailed, continuous transcript of this video. Do not include timestamps, just the spoken text." },
                            { inlineData: { data: base64Data, mimeType } }
                        ]
                    }
                ]
            });
            
            return geminiResponse.text || "No transcript generated.";
        } catch (err: any) {
            console.error("[Agent Tools - generateTranscript] Uploaded video error:", err);
            throw new Error(`Failed to generate transcript from uploaded video: ${err.message}`);
        }
    }
    
    throw new Error("Invalid type provided. Must be 'youtube' or 'upload'.");
}
