"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useState, useMemo } from "react";
import { savePageBlocks } from "@/lib/actions/page.actions";
import { schema } from "@/components/blockNote/schema";

function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

interface BlockNoteContainerProps {
    pageId: string;
    initialTitle: string;
    initialContent?: any[];
}

export default function BlockNoteContainer({ pageId, initialTitle, initialContent }: BlockNoteContainerProps) {
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

    // Debounced save to the database using Server Action
    const debouncedSave = useCallback(
        debounce(async (id: string, blocks: any[]) => {
            setSaveStatus("saving");
            const res = await savePageBlocks(id, blocks);
            if (res.success) {
                setSaveStatus("saved");
            } else {
                setSaveStatus("error");
            }
        }, 1000),
        []
    );

    // Initialize the editor with safety checks and fallback
    const editor = useCreateBlockNote({
        schema,
        initialContent: useMemo(() => {
            if (initialContent && Array.isArray(initialContent) && initialContent.length > 0) {
                try {
                    // If it was already proper JSON but failed internal BlockNote validation, we'll try to just return it
                    return initialContent;
                } catch (e) {
                    console.error("BlockNote failed to parse initialContent:", e);
                    // Fallthrough to default
                }
            }

            // Default safe fallback if undefined, empty, or improperly formatted
            return [
                {
                    type: "heading",
                    props: { level: 1 },
                    content: initialTitle,
                },
            ];
        }, [initialContent, initialTitle]),
    });

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-[var(--color-blockNote-background)] relative">
            <div className="absolute top-4 right-8 z-10 text-xs font-medium px-2 py-1 rounded bg-[var(--color-secondary)]/80 text-[var(--color-text-muted)] backdrop-blur-sm shadow-sm pointer-events-none">
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "saved" && "Saved to Yummy Web"}
                {saveStatus === "error" && <span className="text-red-500">Failed to save</span>}
            </div>

            <div className="flex-1 overflow-y-auto w-full py-2 px-2 sm:px-4">
                <BlockNoteView
                    editor={editor}
                    theme="light"
                    onChange={() => debouncedSave(pageId, editor.document)}
                    className="min-h-full"
                />
            </div>
        </div>
    );
}
