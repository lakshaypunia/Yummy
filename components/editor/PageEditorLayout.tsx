"use client";

import { useState, useRef, useEffect } from "react";
import { EditorWrapper } from "@/components/editor/EditorWrapper";
import Chat from "@/components/editor/Chat";
import { MessageSquare } from "lucide-react";
import { PageVisibilityToggle } from "../PageVisibilityToggle";

interface PageEditorLayoutProps {
    pageId: string;
    chatId: string;
    isAuthor: boolean;
    spaceId: string;
    initialTitle: string;
    initialVisibility: string;
    initialContent?: any[];
    editable?: boolean;
}

export function PageEditorLayout({
    pageId,
    chatId,
    spaceId,
    initialTitle,
    isAuthor,
    initialContent,
    initialVisibility,
    editable = true,
}: PageEditorLayoutProps) {
    const [isSideChatMinimized, setIsSideChatMinimized] = useState(false);
    const [chatWidthPercent, setChatWidthPercent] = useState(30);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizerHovered, setIsResizerHovered] = useState(false);
    const isDraggingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current || !containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const relativeX = e.clientX - containerRect.left;
            const chatWidth = containerWidth - relativeX;
            const newWidthPercent = (chatWidth / containerWidth) * 100;

            if (newWidthPercent >= 20 && newWidthPercent <= 80) {
                setChatWidthPercent(newWidthPercent);
            }
        };

        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                setIsDragging(false);
                document.body.style.cursor = "default";
                document.body.style.userSelect = "auto";
            }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        setIsDragging(true);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    };

    return (
        <div
            ref={containerRef}
            className="flex h-full w-full relative overflow-hidden bg-[var(--color-background)]"
        >
            {/* ── Main Editor Pane ─────────────────────────────────────── */}
            <div
                className={`relative flex flex-col h-full min-w-0 ${
                    isDragging ? "" : "transition-[width] duration-200 ease-out"
                }`}
                style={{
                    width: !isSideChatMinimized ? `${100 - chatWidthPercent}%` : "100%",
                }}
            >
                <div className="flex-1 w-full relative overflow-hidden">
                    {isAuthor && (
                        <PageVisibilityToggle
                            pageId={pageId}
                            initialVisibility={initialVisibility}
                        />
                    )}
                    <EditorWrapper
                        pageId={pageId}
                        spaceId={spaceId}
                        initialTitle={initialTitle}
                        initialContent={initialContent}
                        editable={editable}
                    />
                </div>
            </div>

            {/* ── Resizer ──────────────────────────────────────────────── */}
            {!isSideChatMinimized && (
                <div
                    className="absolute top-0 bottom-0 z-10 flex items-center justify-center"
                    style={{
                        left: `${100 - chatWidthPercent}%`,
                        width: "16px",
                        transform: "translateX(-50%)",
                        cursor: "col-resize",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={() => setIsResizerHovered(true)}
                    onMouseLeave={() => setIsResizerHovered(false)}
                >
                    {/* Hairline track */}
                    <div
                        className="h-full w-px transition-all duration-150"
                        style={{
                            background: isResizerHovered || isDragging
                                ? "var(--color-text-muted)"
                                : "var(--color-border-primary)",
                            opacity: isResizerHovered || isDragging ? 0.6 : 0.3,
                        }}
                    />
                    {/* Drag pill — visible on hover/drag */}
                    <div
                        className="absolute flex flex-col gap-[3px] items-center transition-opacity duration-150"
                        style={{ opacity: isResizerHovered || isDragging ? 1 : 0 }}
                    >
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-muted)]"
                                style={{ opacity: 0.5 + i * 0.1 }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Side Chat Pane ───────────────────────────────────────── */}
            <div
                className={`
                    h-full shrink-0 flex flex-col
                    border-l border-[var(--color-border-primary)]/40
                    bg-[var(--color-card)]
                    ${isDragging ? "" : "transition-[width] duration-200 ease-out"}
                    ${isSideChatMinimized ? "w-12 items-center justify-start pt-4" : ""}
                `}
                style={{
                    width: !isSideChatMinimized ? `${chatWidthPercent}%` : undefined,
                }}
            >
                {isSideChatMinimized ? (
                    /* ── Collapsed pill ── */
                    <button
                        onClick={() => setIsSideChatMinimized(false)}
                        title="Open Chat"
                        className="
                            group relative w-8 h-8 mx-auto
                            rounded-full flex items-center justify-center
                            bg-[var(--color-background)]
                            border border-[var(--color-border-primary)]/50
                            text-[var(--color-text-muted)]
                            hover:border-[var(--color-text-muted)]/60
                            hover:text-[var(--color-text-primary)]
                            hover:shadow-sm
                            transition-all duration-200
                        "
                    >
                        <MessageSquare size={15} strokeWidth={1.5} />
                    </button>
                ) : (
                    /* ── Expanded chat ── */
                    <div className="flex flex-col h-full w-full overflow-hidden px-3 py-3 gap-3">
                        <Chat
                            chatId={chatId}
                            pageId={pageId}
                            spaceId={spaceId}
                            viewMode="side"
                            onMinimizeSideChat={() => setIsSideChatMinimized(true)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}