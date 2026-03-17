"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import "@blocknote/mantine/style.css";
import { useCallback, useState, useEffect, useRef } from "react";
import { savePageBlocks } from "@/lib/actions/page.actions";
import { schema } from "@/components/blockNote/schema";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

interface BlockNoteContainerProps {
    pageId: string;
    initialTitle: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialContent?: any[];
    editable?: boolean;
}

function InnerEditor({ pageId, initialTitle, initialContent, editable, doc, provider, setSaveStatus }: BlockNoteContainerProps & { doc: Y.Doc, provider: WebsocketProvider, setSaveStatus: (status: "saved" | "saving" | "error" | "syncing") => void }) {

    const timeoutRef = useRef<NodeJS.Timeout>(null);
    const editableRef = useRef(editable);

    // Keep the editable ref up-to-date without causing the callback to re-trigger
    useEffect(() => {
        editableRef.current = editable;
    }, [editable]);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Debounced save to the database using Server Action
    // We still do this so Postgres has a cold-storage backup of the document
    const debouncedSave = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (id: string, blocks: any[]) => {
            if (!editableRef.current) return; // Don't let viewers thrash the DB

            setSaveStatus("saving");
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(async () => {
                const res = await savePageBlocks(id, blocks);
                if (res.success) {
                    setSaveStatus("saved");
                } else {
                    setSaveStatus("error");
                }
            }, 2000);
        },
        [setSaveStatus]
    );

    const editor = useCreateBlockNote({
        schema,
        collaboration: {
            provider,
            fragment: doc.getXmlFragment("document-store"),
            user: {
                name: "User", // TODO: Wire to Clerk profile
                color: "#" + Math.floor(Math.random() * 16777215).toString(16) // Random color for cursor
            }
        }
    });

    // Seed the document from PostgreSQL ONLY if the Yjs document arrived empty
    useEffect(() => {
        if (!editor || !initialContent || initialContent.length === 0) return;

        // This checks if the document is essentially the default empty state
        const isEmpty = editor.document.length === 1 && editor.document[0].type === "paragraph" && !editor.document[0].content;

        if (isEmpty) {
            console.log("Seeding Yjs document from PostgreSQL...");
            try {
                editor.replaceBlocks(editor.document, initialContent);
            } catch (e) {
                console.error("Failed to seed initial content:", e);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                editor.replaceBlocks(editor.document, [{ type: "heading", props: { level: 1 }, content: initialTitle }] as any);
            }
        }
    }, [editor, initialContent, initialTitle]);

    const insertExcalidraw = (editor: typeof schema.BlockNoteEditor) => ({
        title: "Whiteboard (Excalidraw)",
        onItemClick: () => {
            const currentBlock = editor.getTextCursorPosition().block;
            // Replace the empty paragraph block with the new block, or insert after
            if (currentBlock.type === "paragraph" && !currentBlock.content) {
                editor.replaceBlocks([currentBlock], [{ type: "excalidraw" }]);
            } else {
                editor.insertBlocks([{ type: "excalidraw" }], currentBlock, "after");
            }
        },
        aliases: ["whiteboard", "drawing", "excalidraw", "board"],
        group: "Media",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
    });

    const insertDesmos = (editor: typeof schema.BlockNoteEditor) => ({
        title: "Graphing Calculator (Desmos)",
        onItemClick: () => {
            const currentBlock = editor.getTextCursorPosition().block;
            // Replace the empty paragraph block with the new block, or insert after
            if (currentBlock.type === "paragraph" && !currentBlock.content) {
                editor.replaceBlocks([currentBlock], [{ type: "desmos" }]);
            } else {
                editor.insertBlocks([{ type: "desmos" }], currentBlock, "after");
            }
        },
        aliases: ["graph", "math", "equation", "desmos"],
        group: "Media",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18 9l-5 5-4-4-5 5"></path></svg>
    });

    const insertReactFlow = (editor: typeof schema.BlockNoteEditor) => ({
        title: "Flowchart (React Flow)",
        onItemClick: () => {
            const currentBlock = editor.getTextCursorPosition().block;
            // Replace the empty paragraph block with the new block, or insert after
            if (currentBlock.type === "paragraph" && !currentBlock.content) {
                editor.replaceBlocks([currentBlock], [{ type: "react_flow" }]);
            } else {
                editor.insertBlocks([{ type: "react_flow" }], currentBlock, "after");
            }
        },
        aliases: ["flow", "chart", "diagram", "reactflow"],
        group: "Media",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-13a.5.5 0 0 0-.5.5z"></path><path d="M12 9v6"></path><path d="M9 12h6"></path></svg>
    });

    useEffect(() => {
        if (!editor) return;

        const handleAiUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { blocks } = customEvent.detail;

            if (blocks && blocks.length > 0) {
                console.log("Applying AI blocks to editor instance...");
                try {
                    editor.replaceBlocks(editor.document, blocks);
                    setSaveStatus("saved");
                } catch (err) {
                    console.error("Failed to apply AI blocks:", err);
                }
            }
        };

        const handleInsertVideoBlock = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { blockId, isLoading } = customEvent.detail;
            const currentBlock = editor.getTextCursorPosition().block;

            if (currentBlock.type === "paragraph" && !currentBlock.content) {
                editor.replaceBlocks([currentBlock], [{ id: blockId, type: "video_block", props: { isLoading: isLoading ? "true" : "false", url: "" } }]);
            } else {
                editor.insertBlocks([{ id: blockId, type: "video_block", props: { isLoading: isLoading ? "true" : "false", url: "" } }], currentBlock, "after");
            }
        };

        const handleUpdateVideoBlock = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { blockId, url, isLoading, error } = customEvent.detail;

            try {
                editor.updateBlock(blockId, {
                    type: "video_block",
                    props: { url: url || "", isLoading: isLoading ? "true" : "false" }
                });
                setSaveStatus("saved");
            } catch (err) {
                console.error("Could not update video block:", err);
            }
        };

        window.addEventListener('ai-blocks-updated', handleAiUpdate);
        window.addEventListener('insert-video-block', handleInsertVideoBlock);
        window.addEventListener('update-video-block', handleUpdateVideoBlock);

        return () => {
            window.removeEventListener('ai-blocks-updated', handleAiUpdate);
            window.removeEventListener('insert-video-block', handleInsertVideoBlock);
            window.removeEventListener('update-video-block', handleUpdateVideoBlock);
        };
    }, [editor, setSaveStatus]);

    if (!editor) return null;

    return (
        <div className="flex-1 overflow-y-auto w-full py-2 px-2 sm:px-4">
            <BlockNoteView
                editor={editor}
                theme="light"
                editable={editable}
                onChange={() => debouncedSave(pageId, editor.document)}
                className="min-h-full"
                slashMenu={false}
            >
                <SuggestionMenuController
                    triggerCharacter={"/"}
                    getItems={async (query) =>
                        filterSuggestionItems(
                            [
                                ...getDefaultReactSlashMenuItems(editor),
                                insertExcalidraw(editor),
                                insertDesmos(editor),
                                insertReactFlow(editor),
                            ],
                            query
                        )
                    }
                />
            </BlockNoteView>
        </div>
    );
}

export default function BlockNoteContainer({ pageId, initialTitle, initialContent, editable = true }: BlockNoteContainerProps) {
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "syncing">("syncing");

    // Yjs State
    const [doc, setDoc] = useState<Y.Doc>();
    const [provider, setProvider] = useState<WebsocketProvider>();
    const [isSynced, setIsSynced] = useState(false);

    useEffect(() => {
        // Create the Yjs document
        const yDoc = new Y.Doc();

        // Connect to our Custom Node Sync Server 
        // We use the pageId as the unique "Room" identifier
        const wsUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "ws://localhost:3000";
        const yProvider = new WebsocketProvider(
            wsUrl,
            pageId,
            yDoc
        );

        // eslint-disable-next-line react-hooks/rules-of-hooks
        yProvider.on("status", (event: { status: string }) => {
            if (event.status === "connected") {
                setSaveStatus("saved");
            } else {
                setSaveStatus("syncing");
            }
        });

        // eslint-disable-next-line react-hooks/rules-of-hooks
        yProvider.on("sync", (synced: boolean) => {
            setIsSynced(synced);
        });

        // Setup custom event listener for AI updates
        const eventWsUrl = wsUrl.replace("ws://", "ws://").replace("wss://", "wss://") + `/events/${pageId}`;
        const eventWs = new WebSocket(eventWsUrl);

        eventWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'ai-update') {
                    // CRITICAL SAFEGUARD: We only want the *initiating* user to run editor.replaceBlocks.
                    // BlockNote's Yjs provider will see this local edit and sync it to everyone else automatically.
                    // If everyone ran this, it would cause infinite CRDT conflicts.
                    // NOTE: Without full Clerk auth connected in this snippet, we might need a simpler check or 
                    // rely on the user visually seeing the new suggestion block appear. 
                    // For now, if your custom sync-server broadcasts, we rely on the first connected client to apply it.
                    // TODO: Replace 'true' with a check against `userId === data.userId` when Clerk user is available
                    if (data.blocks && data.blocks.length > 0) {
                        console.log("Received AI block update from sync-server, applying locally...");
                        // To trigger a force update, we need to pass this down or raise an event the inner editor can catch.
                        // For simplicity in this functional component, we will dispatch a custom DOM event.
                        window.dispatchEvent(new CustomEvent('ai-blocks-updated', { detail: { blocks: data.blocks, userId: data.userId } }));
                    }
                }
            } catch (err) {
                console.error("Error parsing sync event:", err);
            }
        };

        setDoc(yDoc);
        setProvider(yProvider);

        return () => {
            yDoc.destroy();
            yProvider.destroy();
            eventWs.close();
        };
    }, [pageId]);

    // Show loading state until we're connected AND synced with the room's history
    if (!doc || !provider || !isSynced) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 w-full h-full bg-[var(--color-blockNote-background)]">
                <div className="text-sm text-[var(--color-text-muted)] animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 bg-[var(--color-highlight)] rounded-full mr-2" />
                    Connecting to Live Workspace...
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-[var(--color-blockNote-background)] relative animate-in fade-in duration-500">
            <div className="absolute top-2 right-2 z-10 text-xs font-medium px-2 py-1 rounded text-[var(--color-text-muted)] backdrop-blur-sm shadow-sm pointer-events-none transition-all">
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "saved" && <span className="text-green-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> </span>}
                {saveStatus === "syncing" && <span className="text-orange-500">Reconnecting...</span>}
                {saveStatus === "error" && <span className="text-red-500">Failed to save locally</span>}
            </div>

            <InnerEditor
                pageId={pageId}
                initialTitle={initialTitle}
                initialContent={initialContent}
                editable={editable}
                doc={doc}
                provider={provider}
                setSaveStatus={setSaveStatus}
            />
        </div>
    );
}
