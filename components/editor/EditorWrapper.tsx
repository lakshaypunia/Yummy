"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Disable SSR for BlockNote since it relies heavily on the DOM
const Editor = dynamic(() => import("@/components/editor/BlockNoteContainer"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading editor...</p>
        </div>
    ),
});

export function EditorWrapper({
    pageId,
    initialTitle,
    initialContent
}: {
    pageId: string,
    initialTitle: string,
    initialContent?: any[]
}) {
    return <Editor pageId={pageId} initialTitle={initialTitle} initialContent={initialContent} />;
}
