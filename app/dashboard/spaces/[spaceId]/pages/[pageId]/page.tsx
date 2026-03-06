import { getPage } from "@/lib/actions/page.actions";
import { notFound, redirect } from "next/navigation";
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

            <EditorWrapper
                pageId={page.id}
                initialTitle={page.title}
                initialContent={page.blockJson ? (page.blockJson as any) : undefined}
                editable={page.canEdit}
            />
        </div>
    );
}
