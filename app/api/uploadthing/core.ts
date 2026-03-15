import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const f = createUploadthing();
const prisma = new PrismaClient();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    spaceDocument: f({
        pdf: { maxFileSize: "16MB", maxFileCount: 5 },
        text: { maxFileSize: "16MB", maxFileCount: 5 },
        image: { maxFileSize: "16MB", maxFileCount: 5 },
    })
        // Set permissions and file types for this FileRoute
        .middleware(async ({ req }) => {
            // This code runs on your server before upload
            const user = await currentUser();

            // If you throw, the user will not be able to upload
            if (!user) throw new UploadThingError("Unauthorized");

            // Extract spaceId from headers
            const spaceId = req.headers.get("x-space-id");

            if (!spaceId) {
                throw new UploadThingError("Space ID is required");
            }

            // Whatever is returned here is accessible in onUploadComplete as `metadata`
            return { userId: user.id, spaceId: spaceId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log("Upload complete for userId:", metadata.userId);
            console.log("file url", file.url);

            try {
                await prisma.document.create({
                    data: {
                        name: file.name,
                        url: file.url,
                        key: file.key,
                        size: file.size,
                        type: file.type,
                        spaceId: metadata.spaceId,
                        authorId: metadata.userId
                    }
                });
                console.log("Document saved to database successfully.");
            } catch (error) {
                console.error("Error saving document to database:", error);
            }

            // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
            return { uploadedBy: metadata.userId, url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
