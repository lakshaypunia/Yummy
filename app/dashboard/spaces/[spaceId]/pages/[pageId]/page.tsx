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
            <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border-primary)] bg-[var(--color-background)]">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{page.title}</h1>
                    {!page.canEdit && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-[var(--color-primary)] text-[var(--color-text-muted)] rounded-full border border-[var(--color-border-primary)]">
                            Read Only
                        </span>
                    )}
                </div>

                {isAuthor && (
                    <PageVisibilityToggle pageId={page.id} initialVisibility={page.visibility} />
                )}
            </div>

            <PageEditorLayout
                pageId={page.id}
                chatId={chatResult.chatId}
                spaceId={spaceId}
                initialTitle={page.title}
                initialContent={page.blockJson ? (page.blockJson as any) : undefined}
                editable={page.canEdit}
            />
        </div>
    );
}
