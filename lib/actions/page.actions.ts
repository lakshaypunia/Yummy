"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getPagesForSpace(spaceId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const pages = await prisma.page.findMany({
            where: {
                spaceId,
                authorId: userId,
                deletedAt: null,
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
                authorId: userId,
                deletedAt: null,
            },
            include: {
                space: true,
            }
        });
        return page;
    } catch (error) {
        console.error("Failed to fetch page:", error);
        return null;
    }
}

export async function createPage(spaceId: string, title: string = "New Page") {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const page = await prisma.page.create({
            data: {
                title,
                spaceId,
                authorId: userId,
                depth: 0,
                isIntialised: true,
                blockJson: [
                    {
                        type: "heading",
                        props: { level: 1 },
                        content: title,
                    }
                ] as any,
            },
        });

        revalidatePath(`/dashboard/spaces/${spaceId}`);
        return { success: true, pageId: page.id };
    } catch (error) {
        console.error("Failed to create page:", error);
        return { success: false, error: "Failed to create page" };
    }
}

export async function savePageBlocks(pageId: string, blocks: any[]) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        // We are trusting the client blocks structure directly as JSON
        // for this initial web implementation
        const page = await prisma.page.update({
            where: {
                id: pageId,
                authorId: userId,
            },
            data: {
                blockJson: blocks as any,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to save page:", error);
        return { success: false };
    }
}
