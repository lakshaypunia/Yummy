import { getPage } from "@/lib/actions/page.actions";
import { notFound, redirect } from "next/navigation";
import { EditorWrapper } from "@/components/editor/EditorWrapper";

export default async function PageEditorView({
    params,
}: {
    params: Promise<{ spaceId: string; pageId: string }>;
}) {
    const { spaceId, pageId } = await params;

    if (pageId === "new") {
        // Create a page automatically if we landed here without one
        redirect(`/dashboard/spaces/${spaceId}`);
    }

    const page = await getPage(pageId);

    if (!page) {
        return notFound();
    }

    return (
        <div className="flex flex-col h-full w-full bg-white relative">
            <EditorWrapper
                pageId={page.id}
                initialTitle={page.title}
                initialContent={page.blockJson ? (page.blockJson as any) : undefined}
            />
        </div>
    );
}
