import { LectureSidebar } from "@/components/LectureSidebar";
import { getLecturesForSpace } from "@/lib/actions/lecture.actions";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export default async function LecturesLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ spaceId: string }>;
}) {
    const { spaceId } = await params;
    
    const space = await prisma.space.findUnique({
        where: { id: spaceId }
    });
    
    const lectures = await getLecturesForSpace(spaceId);
    const { userId } = await auth();
    const isOwner = space?.authorId === userId;

    return (
        <>
            <LectureSidebar
                spaceId={spaceId}
                initialLectures={lectures.map((l: any) => ({ id: l.id, title: l.title }))}
                isOwner={isOwner}
            />
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
                {children}
            </div>
        </>
    );
}
