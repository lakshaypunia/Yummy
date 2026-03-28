import { MasterSidebar } from "@/components/MasterSidebar";
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
        where: { id: spaceId },
        include: {
            pages: {
                where: { deletedAt: null },
                orderBy: { createdAt: "asc" },
                take: 1,
                select: { id: true }
            }
        }
    });

    if (!space) return notFound();

    const rootPageId = space.pages?.[0]?.id || "new";
    const defaultPageHref = `/dashboard/spaces/${space.id}/pages/${rootPageId}`;

    const { userId } = await auth();
    const isOwner = space.authorId === userId;

    return (
        <RealtimeSpaceProvider spaceId={spaceId}>
            <SpaceWhiteboardOverlay spaceId={spaceId} />
            <LiveKitBroadcastOverlay spaceId={spaceId} />
            <InviteToBroadcastModal spaceId={spaceId} />

            <div className="flex h-screen w-full overflow-hidden bg-[var(--color-blockNote-background)]">
                <MasterSidebar spaceId={spaceId} isOwner={isOwner} defaultPageHref={defaultPageHref} />
                {children}
            </div>
        </RealtimeSpaceProvider>
    );
}