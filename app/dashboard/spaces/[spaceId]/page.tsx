import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

export default async function SpacePage({
    params,
}: {
    params: Promise<{ spaceId: string }>;
}) {
    const { spaceId } = await params;

    // Find the first page of this space
    const firstPage = await prisma.page.findFirst({
        where: {
            spaceId,
            deletedAt: null,
        },
        orderBy: { createdAt: "asc" },
        select: { id: true },
    });

    if (!firstPage) return notFound();

    redirect(`/dashboard/spaces/${spaceId}/pages/${firstPage.id}`);
}
