import { getPage } from "@/lib/actions/page.actions";
import { getOrCreateChat } from "@/lib/actions/space.actions";
import { notFound, redirect } from "next/navigation";
import { PageEditorLayout } from "@/components/editor/PageEditorLayout";
import { EditorWrapper } from "@/components/editor/EditorWrapper";
import { auth } from "@clerk/nextjs/server";
import { PageVisibilityToggle } from "@/components/PageVisibilityToggle";

export default async function PageEditorView({
    params,
}: {
    params: Promise<{ spaceId: string; pageId: string }>;
}) {
    const { spaceId, pageId } = await params;
    const { userId } = await auth();

    if (pageId === "new") {
        redirect(`/dashboard/spaces/${spaceId}`);
    }

    const page = await getPage(pageId);

    if (!page) {
        return notFound();
    }

    // Try to get or create chat for the user
    const chatResult = await getOrCreateChat(spaceId);
    if (!chatResult.success || !chatResult.chatId) {
        throw new Error(`Chat initialization failed: ${chatResult.error}`);
    }

    const isAuthor = page.authorId === userId;

    return (
        <div className="flex flex-col h-full w-full bg-white relative">
            <PageEditorLayout
                isAuthor={isAuthor}
                pageId={page.id}
                chatId={chatResult.chatId}
                initialVisibility={page.visibility}
                spaceId={spaceId}
                initialTitle={page.title}
                initialContent={page.blockJson ? (page.blockJson as any) : undefined}
                editable={page.canEdit}
            />
        </div>
    );
}
