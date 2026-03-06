"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Helper to check if a user is in a space
async function isUserInSpace(spaceId: string, userId: string) {
    const space = await prisma.space.findUnique({ where: { id: spaceId } });
    if (space?.authorId === userId) return { isAuthor: true, isMember: true };

    const member = await prisma.spaceMember.findUnique({
        where: { spaceId_userId: { spaceId, userId } }
    });
    return { isAuthor: false, isMember: !!member };
}

export async function getPagesForSpace(spaceId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const { isAuthor, isMember } = await isUserInSpace(spaceId, userId);
        if (!isMember) return [];

        const pages = await prisma.page.findMany({
            where: {
                spaceId,
                deletedAt: null,
                ...(isAuthor ? {} : { visibility: { not: "PRIVATE" } }) // Hide private pages from standard members
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        return pages;
    } catch (error) {
        console.error("Failed to fetch pages:", error);
        return [];
    }
}

export async function getPage(pageId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const page = await prisma.page.findFirst({
            where: {
                id: pageId,
                deletedAt: null,
            },
            include: {
                space: true,
            }
        });

        if (!page) return null;

        const { isAuthor, isMember } = await isUserInSpace(page.spaceId, userId);
        if (!isMember) return null;
        if (!isAuthor && page.visibility === "PRIVATE") return null;

        // Return the resolved page and if the user has edit access
        return { ...page, canEdit: isAuthor || page.visibility === "EDITABLE" };
    } catch (error) {
        console.error("Failed to fetch page:", error);
        return null;
    }
}

export async function createPage(spaceId: string, title: string = "New Page") {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const { isAuthor } = await isUserInSpace(spaceId, userId);
        if (!isAuthor) {
            return { success: false, error: "Only the author can create new pages" };
        }

        const page = await prisma.page.create({
            data: {
                title,
                spaceId,
                authorId: userId,
                depth: 0,
                isIntialised: true,
                visibility: "EDITABLE",
                blockJson: [
                    {
                        type: "heading",
                        props: { level: 1 },
                        content: title,
                    }
                ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            },
        });

        revalidatePath(`/dashboard/spaces/${spaceId}`);
        return { success: true, pageId: page.id };
    } catch (error) {
        console.error("Failed to create page:", error);
        return { success: false, error: "Failed to create page" };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function savePageBlocks(pageId: string, blocks: any[]) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const page = await prisma.page.findUnique({ where: { id: pageId } });
        if (!page) return { success: false, error: "Page not found" };

        const { isAuthor, isMember } = await isUserInSpace(page.spaceId, userId);

        // Block saves if they aren't the author and the page is NOT editable
        if (!isAuthor && (!isMember || page.visibility !== "EDITABLE")) {
            return { success: false, error: "Write access denied" };
        }

        await prisma.page.update({
            where: { id: pageId },
            data: { blockJson: blocks as any }, // eslint-disable-line @typescript-eslint/no-explicit-any
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to save page:", error);
        return { success: false };
    }
}

export async function updatePageVisibility(pageId: string, visibility: "PRIVATE" | "VIEW_ONLY" | "EDITABLE") {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const page = await prisma.page.findUnique({ where: { id: pageId } });
        if (!page || page.authorId !== userId) {
            return { success: false, error: "Only the author can change visibility" };
        }

        await prisma.page.update({
            where: { id: pageId },
            data: { visibility }
        });

        revalidatePath(`/dashboard/spaces/${page.spaceId}`);
        revalidatePath(`/dashboard/spaces/${page.spaceId}/pages/${pageId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update visibility:", error);
        return { success: false };
    }
}
