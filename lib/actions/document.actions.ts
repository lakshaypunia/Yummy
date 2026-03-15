"use server";

import { PrismaClient } from "@prisma/client";
import { UTApi } from "uploadthing/server";
import { currentUser } from "@clerk/nextjs/server";

const prisma = new PrismaClient();
const utapi = new UTApi();

export async function getSpaceDocuments(spaceId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // Verify user is member of the space
        const access = await prisma.spaceMember.findUnique({
            where: {
                spaceId_userId: {
                    spaceId: spaceId,
                    userId: user.id
                }
            }
        });

        if (!access) {
            // Also check if they are the author
            const space = await prisma.space.findUnique({ where: { id: spaceId } });
            if (space?.authorId !== user.id) {
                return { success: false, error: "Unauthorized access to space documents" };
            }
        }

        const documents = await prisma.document.findMany({
            where: {
                spaceId: spaceId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return { success: true, documents };
    } catch (error) {
        console.error("Error fetching space documents:", error);
        return { success: false, error: "Failed to fetch documents" };
    }
}

export async function deleteDocument(documentId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const document = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            return { success: false, error: "Document not found" };
        }

        if (document.authorId !== user.id) {
            // Allow space owner to delete as well
            const space = await prisma.space.findUnique({ where: { id: document.spaceId } });
            if (space?.authorId !== user.id) {
                return { success: false, error: "Unauthorized to delete this document" };
            }
        }

        // Delete from UploadThing
        await utapi.deleteFiles(document.key);

        // Delete from database
        await prisma.document.delete({
            where: { id: documentId },
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);
        return { success: false, error: "Failed to delete document" };
    }
}
