import { PageSidebar } from "@/components/PageSidebar";
import { getPagesForSpace } from "@/lib/actions/page.actions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RealtimeSpaceProvider } from "@/components/RealtimeSpaceContext";

export default async function SpaceLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ spaceId: string }>;
}) {
    const { spaceId } = await params;

    // Quick check if space exists to 404
    const space = await prisma.space.findUnique({
        where: { id: spaceId }
    });

    if (!space) return notFound();

    // Fetch initial pages for the sidebar
    const pages = await getPagesForSpace(spaceId);

    return (
        <RealtimeSpaceProvider spaceId={spaceId}>
            <div className="flex h-full w-full bg-white overflow-hidden">
                {/* Contextual Secondary Sidebar just for Pages */}
                <PageSidebar spaceId={spaceId} initialPages={pages.map((p: any) => ({ id: p.id, title: p.title, visibility: p.visibility }))} />

                {/* Main Editor Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>
            </div>
        </RealtimeSpaceProvider>
    );
}
