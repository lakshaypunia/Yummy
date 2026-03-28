import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PlaySquare } from "lucide-react";

export default async function LecturesPage({
    params,
}: {
    params: Promise<{ spaceId: string }>;
}) {
    const { spaceId } = await params;

    const firstLecture = await prisma.lecture.findFirst({
        where: { spaceId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
    });

    if (firstLecture) {
        redirect(`/dashboard/spaces/${spaceId}/lectures/${firstLecture.id}`);
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-blockNote-background)]">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center mb-4 border border-[var(--color-border-primary)]/40 shadow-sm">
                <PlaySquare className="w-8 h-8 text-[var(--color-text-muted)] opacity-60" />
            </div>
            <h2 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No Lectures Yet</h2>
            <p className="text-sm text-[var(--color-text-muted)] text-center max-w-sm leading-relaxed">
                Lectures allow you to embed video tutorials and lessons next to your notes. Create the first lecture from the sidebar to get started.
            </p>
        </div>
    );
}
