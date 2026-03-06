"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getSpaces() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const spaces = await prisma.space.findMany({
            where: {
                authorId: userId,
                deletedAt: null, // Don't show deleted spaces
            },
            orderBy: {
                updatedAt: "desc",
            },
            include: {
                pages: {
                    take: 1, // Just to get the count or root page easily
                }
            }
        });
        return spaces;
    } catch (error) {
        console.error("Failed to fetch spaces:", error);
        return [];
    }
}

export async function createSpace(name: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!name.trim()) throw new Error("Space name is required");

    try {
        // We are creating the space and its initial root page in one transaction
        const newSpace = await prisma.$transaction(async (tx: any) => {
            const space = await tx.space.create({
                data: {
                    name,
                    authorId: userId,
                    // Desktop compatibility defaults
                    timeline: "CONTINUOUS",
                    visibility: "PRIVATE",
                    goal: "General Workspace",
                    skillLevel: "BEGINNER",
                    tags: [],
                    learningStyle: "SELF_PACED",
                    contentFormatPreference: "TEXT_FOCUSED",
                    depthPreference: "BALANCED",
                    resources: [],
                    project_roadmap: {},
                },
            });

            // Create formatting matching BlockNote's expected JSON array
            const initialRootBlock = [
                {
                    type: "heading",
                    props: { level: 1 },
                    content: name,
                }
            ];

            await tx.page.create({
                data: {
                    title: "Home Page",
                    spaceId: space.id,
                    authorId: userId,
                    depth: 0,
                    isIntialised: true,
                    blockJson: initialRootBlock as any,
                },
            });

            return space;
        });

        revalidatePath("/dashboard");
        return { success: true, spaceId: newSpace.id };
    } catch (error) {
        console.error("Failed to create space:", error);
        return { success: false, error: "Failed to create space" };
    }
}
