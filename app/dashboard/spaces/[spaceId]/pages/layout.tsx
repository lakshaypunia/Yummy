import { PageSidebar } from "@/components/PageSidebar";
import { getPagesForSpace } from "@/lib/actions/page.actions";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export default async function PagesLayout({
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
    
    const pages = await getPagesForSpace(spaceId);
    const { userId } = await auth();
    const isOwner = space?.authorId === userId;

    return (
        <>
            <PageSidebar
                spaceId={spaceId}
                initialPages={pages.map((p: any) => ({ id: p.id, title: p.title, visibility: p.visibility }))}
                isOwner={isOwner}
            />
            {/* ✅ flex-1 + min-w-0 so this column actually fills remaining space */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
                {children}
            </div>
        </>
    );
}
