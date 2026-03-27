"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ensureUserExists } from "@/lib/actions/user.actions";

export async function getSpaces() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        // Fetch spaces authored by the user
        const authoredSpaces = await prisma.space.findMany({
            where: {
                authorId: userId,
                deletedAt: null,
            },
            include: {
                pages: {
                    take: 1,
                    where: { deletedAt: null },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        // Fetch spaces joined by the user
        const joinedSpaceMemberships = await prisma.spaceMember.findMany({
            where: {
                userId: userId,
                space: {
                    deletedAt: null,
                }
            },
            include: {
                space: {
                    include: {
                        pages: {
                            take: 1,
                            where: { deletedAt: null },
                            orderBy: { createdAt: "asc" },
                        },
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // Extract the space objects from the memberships
        const joinedSpaces = joinedSpaceMemberships.map(membership => membership.space);

        // Combine authored and joined spaces, and remove duplicates just in case (e.g. author is a member)
        const allSpacesMap = new Map();
        authoredSpaces.forEach(space => allSpacesMap.set(space.id, space));
        joinedSpaces.forEach(space => allSpacesMap.set(space.id, space));

        return Array.from(allSpacesMap.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
        console.error("Failed to fetch spaces:", error);
        return [];
    }
}

export async function createSpace(name: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await ensureUserExists();

    try {
        const space = await prisma.space.create({
            data: {
                name,
                authorId: userId,
                timeline: "CONTINUOUS",
                visibility: "PRIVATE",
                goal: "General Workspace",
                skillLevel: "BEGINNER",
                learningStyle: "SELF_PACED",
                contentFormatPreference: "HYBRID",
                depthPreference: "BALANCED",
                project_roadmap: {},
                pages: {
                    create: {
                        title: "Home Page",
                        authorId: userId,
                        depth: 0,
                        isIntialised: true,
                        blockJson: [
                            {
                                type: "heading",
                                props: { level: 1 },
                                content: "Welcome to " + name,
                            }
                        ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                    }
                }
            },
            include: {
                pages: { take: 1 }
            }
        });

        const rootPageId = space.pages[0]?.id;
        revalidatePath("/dashboard");
        return { success: true, spaceId: space.id, pageId: rootPageId };
    } catch (error) {
        console.error("Failed to create space:", error);
        return { success: false, error: "Failed to create space" };
    }
}

export async function joinSpace(spaceId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await ensureUserExists();

    try {
        // Verify space exists and isn't deleted
        const space = await prisma.space.findUnique({
            where: { id: spaceId }
        });

        if (!space || space.deletedAt) {
            return { success: false, error: "Space not found" };
        }

        if (space.authorId === userId) {
            return { success: false, error: "You are already the owner of this space" };
        }

        // Create membership
        await prisma.spaceMember.create({
            data: {
                spaceId,
                userId,
                role: "MEMBER"
            }
        });

        revalidatePath("/dashboard");
        return { success: true, spaceId };
    } catch (error: unknown) {
        console.error("Failed to join space:", error);
        // Safely check for Prisma error code without using 'any'
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
            return { success: false, error: "You have already joined this space" };
        }
        return { success: false, error: "Failed to join space" };
    }
}

export async function getOrCreateChat(spaceId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await ensureUserExists();

    try {
        // Try to find existing chat
        let chat = await prisma.chat.findFirst({
            where: {
                spaceId,
                userId,
                status: "ACTIVE",
                deletedAt: null
            }
        });

        // If no chat exists, create one
        if (!chat) {
            chat = await prisma.chat.create({
                data: {
                    spaceId,
                    userId,
                    status: "ACTIVE"
                }
            });
        }

        return { success: true, chatId: chat.id };
    } catch (error) {
        console.error("Failed to get or create chat:", error);
        return { success: false, error: "Failed to initialize chat" };
    }
}
