"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getSpaceWhiteboard(spaceId: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const space = await prisma.space.findUnique({
            where: { id: spaceId }
        });

        if (!space) {
            return { success: false, error: "Space not found" };
        }

        const members = await prisma.spaceMember.findMany({ where: { spaceId, userId } });

        // Must be author or a member, or space must be public (simplified access check)
        const isAuthor = space.authorId === userId;
        const isMember = members.length > 0;

        if (!isAuthor && !isMember && space.visibility === "PRIVATE") {
            return { success: false, error: "Unauthorized access to space" };
        }

        let whiteboard = await prisma.whiteboard.findUnique({ where: { spaceId } });
        if (!whiteboard) {
            whiteboard = await prisma.whiteboard.create({
                data: { spaceId }
            });
        }

        return {
            success: true,
            data: {
                elements: whiteboard.elements || [],
                appState: whiteboard.appState || {},
                files: whiteboard.files || {}
            }
        };
    } catch (e) {
        console.error("Error fetching whiteboard:", e);
        return { success: false, error: "Failed to fetch whiteboard" };
    }
}

export async function updateSpaceWhiteboard(spaceId: string, data: { elements: any, appState?: any, files?: any }) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        // Verify access - must exist and user must have edit rights
        // For simplicity, limiting write to author or members
        const space = await prisma.space.findUnique({
            where: { id: spaceId }
        });

        if (!space) return { success: false, error: "Space not found" };

        const isAuthor = space.authorId === userId;
        const members = await prisma.spaceMember.findMany({ where: { spaceId, userId } });
        const isMember = members.length > 0;

        if (!isAuthor && !isMember) {
            return { success: false, error: "Cannot edit this whiteboard" };
        }

        await prisma.whiteboard.update({
            where: { spaceId },
            data: {
                elements: data.elements,
                appState: data.appState,
                files: data.files
            }
        });

        return { success: true };
    } catch (e) {
        console.error("Error updating whiteboard:", e);
        return { success: false, error: "Failed to save whiteboard" };
    }
}
