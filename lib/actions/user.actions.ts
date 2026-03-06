"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function ensureUserExists() {
    const user = await currentUser();
    if (!user) return null;

    const email = user.emailAddresses[0]?.emailAddress || `${user.id}@placeholder.com`;
    const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User';

    try {
        const dbUser = await prisma.user.upsert({
            where: { clerkId: user.id },
            update: {
                email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: name,
                avatarUrl: user.imageUrl,
            },
            create: {
                clerkId: user.id,
                email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: name,
                avatarUrl: user.imageUrl,
            }
        });
        return dbUser;
    } catch (e) {
        console.error("Failed to sync user to database:", e);
        return null;
    }
}
