"use server";

import { ai } from "@/lib/ai/ai.service";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Downloads a file from an UploadThing URL, stores it temporarily,
 * uploads it to Gemini, creates a Context Cache, and saves the reference to Postgres.
 */
export async function cacheDocumentForPage(pageId: string, fileUrl: string, mimeType: string = "application/pdf") {
    let tempFilePath: string | null = null;
    try {
        console.log(`[RAG] Starting context caching for page ${pageId} with file ${fileUrl}`);
        
        // 1. Download the file from UploadThing
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch file from ${fileUrl}: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        
        // 2. Save it to a temporary file because Gemini SDK needs a local file path
        const tempDir = os.tmpdir();
        const fileName = `rag-${Date.now()}.pdf`;
        tempFilePath = path.join(tempDir, fileName);
        fs.writeFileSync(tempFilePath, Buffer.from(buffer));
        
        console.log(`[RAG] File downloaded to temp path: ${tempFilePath}`);

        // 3. Upload the file to Gemini's File API
        console.log(`[RAG] Uploading to Gemini File API...`);
        const uploadResult = await ai.files.upload({
            file: tempFilePath,
            mimeType: mimeType,
            displayName: `Document for Page ${pageId}`,
        });
        
        console.log(`[RAG] Upload complete. URI: ${uploadResult.uri}`);

        // 4. Try to Create the Context Cache (Fails on free-tier keys)
        let cacheName = null;
        try {
            console.log(`[RAG] Creating Context Cache...`);
            const cacheResult = await ai.caches.create({
                model: "gemini-1.5-pro-002",
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                fileData: {
                                    fileUri: uploadResult.uri,
                                    mimeType: uploadResult.mimeType || mimeType,
                                }
                            }
                        ]
                    }
                ],
                ttl: "3600s",
            });
            cacheName = cacheResult.name;
            console.log(`[RAG] Cache created successfully. Name: ${cacheName}`);
        } catch (cacheError: any) {
            console.log(`[RAG] Explicit Context Caching failed (likely due to free API key limitations). Falling back to implicit File API RAG. Reason: ${cacheError.message}`);
        }

        // 5. Update the Database with the file and cache reference (if created)
        await prisma.page.update({
            where: { id: pageId },
            data: {
                geminiFileUri: uploadResult.uri,
                geminiCacheName: cacheName,
                cacheExpiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour from now
            }
        });

        return { success: true, cacheName: cacheName, fileUri: uploadResult.uri };
        
    } catch (error) {
        console.error("[RAG] Failed to cache document:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    } finally {
        // Clean up the temporary file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
                console.log(`[RAG] Cleaned up temp file: ${tempFilePath}`);
            } catch (cleanupError) {
                console.error(`[RAG] Failed to clean up temp file:`, cleanupError);
            }
        }
    }
}
