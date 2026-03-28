"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createLecture(spaceId: string, title: string, videoUrl: string, description?: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const space = await prisma.space.findUnique({
        where: { id: spaceId }
    });

    if (!space) throw new Error("Space not found");
    // Ensure owner logic follows the same convention
    if (space.authorId !== userId) throw new Error("Only the owner can create lectures");

    const lecture = await prisma.lecture.create({
        data: {
            title,
            videoUrl,
            description,
            spaceId,
            authorId: userId
        }
    });

    revalidatePath(`/dashboard/spaces/${spaceId}/lectures`);
    return { success: true, lecture };
}

export async function getLecturesForSpace(spaceId: string) {
    return prisma.lecture.findMany({
        where: { spaceId },
        orderBy: { createdAt: "asc" }
    });
}

export async function getLecture(lectureId: string) {
    return prisma.lecture.findUnique({
        where: { id: lectureId }
    });
}
