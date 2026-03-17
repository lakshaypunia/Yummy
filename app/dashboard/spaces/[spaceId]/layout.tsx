import { PageSidebar } from "@/components/PageSidebar";
import { getPagesForSpace } from "@/lib/actions/page.actions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { RealtimeSpaceProvider } from "@/components/RealtimeSpaceContext";
import { SpaceWhiteboardOverlay } from "@/components/SpaceWhiteboardOverlay";
import { LiveKitBroadcastOverlay } from "@/components/LiveKitBroadcastOverlay";
import { InviteToBroadcastModal } from "@/components/InviteToBroadcastModal";

export default async function SpaceLayout({
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

    if (!space) return notFound();

    const pages = await getPagesForSpace(spaceId);
    const { userId } = await auth();
    const isOwner = space.authorId === userId;

    return (
        <RealtimeSpaceProvider spaceId={spaceId}>
            <SpaceWhiteboardOverlay spaceId={spaceId} />
            <LiveKitBroadcastOverlay spaceId={spaceId} />
            <InviteToBroadcastModal spaceId={spaceId} />

            <div className="flex h-screen w-full overflow-hidden bg-[var(--color-blockNote-background)]">
                <PageSidebar
                    spaceId={spaceId}
                    initialPages={pages.map((p: any) => ({ id: p.id, title: p.title, visibility: p.visibility }))}
                    isOwner={isOwner}
                />
                {/* ✅ flex-1 + min-w-0 so this column actually fills remaining space */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
                    {children}
                </div>
            </div>
        </RealtimeSpaceProvider>
    );
}