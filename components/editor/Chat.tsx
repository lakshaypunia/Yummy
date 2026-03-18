"use client";

import { ArrowUp, ChevronDown, Loader2, Plus, Minimize2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { useStreamingChat } from "@/hooks/useSendChat"
import ReactMarkdown from "react-markdown"
import { uploadFiles } from "@/utils/uploadthing"

interface ChatProps {
    chatId: string;
    pageId: string;
    viewMode?: 'top' | 'side';
    onMinimizeSideChat?: () => void;
}

export default function Chat({ chatId, pageId, viewMode = 'top', onMinimizeSideChat }: ChatProps) {
    const queryClient = useQueryClient();
    const [userQuery, setUserQuery] = useState("")

    const [isDropdownOpen, setIsDropdownOpen] = useState(true)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const handleVideoIntent = async (code: string) => {
        try {
            const blockId = `video-${Date.now()}`;
            window.dispatchEvent(new CustomEvent("insert-video-block", { detail: { blockId, isLoading: true } }));

            const syncServerUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "ws://localhost:3000";
            const apiUrl = syncServerUrl.replace("ws://", "http://").replace("wss://", "https://") + "/api/generate-video";

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate video on server");
            }

            const blob = await response.blob();
            const videoFile = new File([blob], "ai-video.mp4", { type: "video/mp4" });

            const uploadResponse = await uploadFiles("spaceDocument", {
                files: [videoFile],
                headers: { "x-space-id": pageId }
            });

            if (uploadResponse && uploadResponse[0]) {
                window.dispatchEvent(new CustomEvent("update-video-block", {
                    detail: { blockId, url: uploadResponse[0].url, isLoading: false }
                }));
            } else {
                throw new Error("Local video generation failed to return a path.");
            }
        } catch (error) {
            console.error("Error generating video:", error);
            window.dispatchEvent(new CustomEvent("update-video-block", {
                detail: { blockId: "error", url: null, isLoading: false, error: "Failed to generate video" }
            }));
        }
    }

    const handleDiagramIntent = async (mermaidCode: string) => {
        try {
            const { parseMermaidToExcalidraw } = await import("@excalidraw/mermaid-to-excalidraw");
            const { elements, files } = await parseMermaidToExcalidraw(mermaidCode);
            window.dispatchEvent(new CustomEvent("insert-diagram-block", {
                detail: {
                    elements: JSON.stringify(elements),
                    files: files ? JSON.stringify(files) : null
                }
            }));
        } catch (error) {
            console.error("Failed to parse Mermaid to Excalidraw:", error);
        }
    };

    const handleP5Intent = async (htmlCode: string) => {
        window.dispatchEvent(new CustomEvent("insert-p5-block", { detail: { code: htmlCode } }));
    };

    const handleReactFlowIntent = async (flowData: any) => {
        window.dispatchEvent(new CustomEvent("insert-react-flow-block", {
            detail: {
                nodes: JSON.stringify(flowData.nodes || []),
                edges: JSON.stringify(flowData.edges || [])
            }
        }));
    };

    const {
        messages: chatmessages,
        isStreaming,
        sendMessage,
    } = useStreamingChat({
        chatId,
        pageId,
        onVideoIntent: handleVideoIntent,
        onDiagramIntent: handleDiagramIntent,
        onP5Intent: handleP5Intent,
        onReactFlowIntent: handleReactFlowIntent
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatmessages, isDropdownOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (viewMode === 'top' && chatmessages.length > 0 && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [chatmessages.length, viewMode])

    const isTop = viewMode === 'top';

    /* ─── Top-mode floating input bar ─────────────────────────────── */
    // No messages → vertically centred; has messages → pinned to bottom
    const hasMessages = chatmessages.length > 0;
    const topInputBarPosition = hasMessages ? "bottom-4" : "top-1/2 -translate-y-1/2";
    const topInputBar = `
        w-[min(560px,90%)] left-1/2 -translate-x-1/2
        absolute ${topInputBarPosition}
        flex items-center gap-2 px-3 py-2
        rounded-xl
        bg-[var(--color-card)]/80 backdrop-blur-xl
        border border-[var(--color-border-primary)]/60
        shadow-[0_2px_16px_rgba(0,0,0,0.06)]
        z-[1000]
        transition-all duration-300 ease-out
        focus-within:shadow-[0_4px_24px_rgba(0,0,0,0.1)]
        focus-within:border-[var(--color-border-primary)]
    `;

    /* ─── Side-mode input bar ──────────────────────────────────────── */
    const sideInputBar = `
        w-full flex items-center gap-2 px-3 py-2.5
        rounded-xl
        bg-[var(--color-background)]
        border border-[var(--color-border-primary)]/50
        shadow-sm
        transition-all duration-200
        focus-within:border-[var(--color-border-primary)]
        focus-within:shadow-[0_0_0_2px_var(--color-border-primary)/10]
        shrink-0
    `;

    /* ─── Top-mode message dropdown — grows upward from the input bar ─ */
    const topDropdown = `
        w-[min(600px,80%)] left-1/2 -translate-x-1/2
        absolute bottom-[4.25rem]
        flex flex-col
        bg-[var(--color-card)]/95 backdrop-blur-xl
        border border-[var(--color-border-primary)]/50
        rounded-xl shadow-[0_-4px_32px_rgba(0,0,0,0.06)]
        max-h-[400px] overflow-hidden
        z-[1000] p-3
    `;

    /* ─── Side-mode message area ───────────────────────────────────── */
    const sideDropdown = `
        w-full flex-1 flex flex-col
        bg-transparent
        overflow-hidden
        min-h-0
    `;

    return (
        <div
            ref={dropdownRef}
            className={`flex flex-col ${isTop ? "relative h-full w-full" : `h-full w-full gap-3 ${hasMessages ? "justify-end" : "justify-center"}`}`}
        >
            {/* ── Collapsed Tab (top mode only) ──────────────────────── */}
            <AnimatePresence>
                {isTop && chatmessages.length > 0 && !isDropdownOpen && (
                    <motion.div
                        layoutId="chat-container"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="
                            w-[min(500px,80%)] left-1/2 -translate-x-1/2
                            absolute bottom-[3.75rem] z-[1000]
                            flex items-center justify-between
                            px-4 py-1.5
                            bg-[var(--color-card)]/90 backdrop-blur-xl
                            border border-b-0 border-[var(--color-border-primary)]/40
                            rounded-t-xl cursor-pointer
                            hover:bg-[var(--color-card)]
                            transition-colors duration-150
                        "
                        onClick={() => setIsDropdownOpen(true)}
                    >
                        <span className="text-[var(--color-text-muted)] text-xs tracking-wide">
                            {chatmessages.length} message{chatmessages.length !== 1 ? "s" : ""}
                        </span>
                        <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Message Area ───────────────────────────────────────── */}
            {chatmessages.length > 0 && (isDropdownOpen || !isTop) && (
                <motion.div
                    layout={isTop}
                    layoutId={isTop ? "chat-container" : undefined}
                    initial={isTop ? { opacity: 0, y: 6 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={isTop ? topDropdown : sideDropdown}
                >
                    <div
                        ref={scrollRef}
                        className="flex flex-col gap-2 w-full h-full overflow-y-auto pr-1"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "var(--color-border-primary) transparent" }}
                    >
                        {chatmessages.map((msg: any, index: number) => {
                            if (!msg.content && msg.role === "USER") return null;
                            if (!msg.content && msg.role !== "USER" && index !== chatmessages.length - 1) return null;

                            const isUser = msg.role === "USER";

                            return (
                                <div
                                    key={msg.id || index}
                                    className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.content ? (
                                        <div
                                            className={`
                                                text-[13px] leading-relaxed
                                                prose prose-sm max-w-none
                                                ${isUser
                                                    ? `
                                                        max-w-[78%] px-3 py-2
                                                        bg-[var(--color-primary)]/15
                                                        border border-[var(--color-border-primary)]/40
                                                        rounded-2xl rounded-tr-sm
                                                        text-[var(--color-text-primary)]
                                                    `
                                                    : `
                                                        w-full px-1 py-1
                                                        text-[var(--color-text-primary)]
                                                        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                                                    `
                                                }
                                            `}
                                        >
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        /* Streaming indicator */
                                        <div className="flex items-center gap-1 px-1 py-3">
                                            {[0, 1, 2].map(i => (
                                                <span
                                                    key={i}
                                                    className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]/50"
                                                    style={{
                                                        animation: "pulse 1.2s ease-in-out infinite",
                                                        animationDelay: `${i * 0.2}s`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* ── Input Bar ──────────────────────────────────────────── */}
            <div className={isTop ? topInputBar : sideInputBar}>
                <div className="flex items-center gap-2 w-full">
                    {/* Side-mode: minimize button */}
                    {!isTop && onMinimizeSideChat && (
                        <button
                            onClick={onMinimizeSideChat}
                            className="
                                shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                                text-[var(--color-text-muted)]
                                hover:bg-[var(--color-primary)]/20
                                hover:text-[var(--color-text-primary)]
                                transition-colors duration-150
                            "
                            title="Minimize chat"
                        >
                            <Minimize2 size={14} strokeWidth={1.75} />
                        </button>
                    )}

                    {/* Top-mode: plus icon */}
                    {isTop && (
                        <div className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-[var(--color-primary)]/20 text-[var(--color-text-muted)]">
                            <Plus size={14} strokeWidth={2} />
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={inputRef}
                        onFocus={() => setIsDropdownOpen(true)}
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        disabled={isStreaming}
                        onKeyDown={async (e) => {
                            if (e.key === "Enter" && userQuery.trim() !== "" && !isStreaming) {
                                e.preventDefault();
                                const query = userQuery;
                                setUserQuery("");
                                await sendMessage(query);
                            }
                        }}
                        type="text"
                        placeholder={isStreaming ? "Thinking…" : "Ask AI anything…"}
                        className="
                            flex-1 min-w-0 bg-transparent
                            text-[13px] text-[var(--color-text-primary)]
                            placeholder:text-[var(--color-text-muted)]/60
                            outline-none
                            disabled:opacity-40
                            py-0.5
                        "
                    />

                    {/* Send button */}
                    <button
                        disabled={userQuery.trim() === "" || isStreaming}
                        onClick={async () => {
                            const query = userQuery;
                            setUserQuery("");
                            await sendMessage(query);
                        }}
                        className="
                            shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                            bg-[var(--color-primary)]/20
                            text-[var(--color-text-muted)]
                            hover:bg-[var(--color-primary)]/35
                            hover:text-[var(--color-text-primary)]
                            disabled:opacity-30 disabled:cursor-not-allowed
                            transition-all duration-150
                        "
                    >
                        {isStreaming
                            ? <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                            : <ArrowUp size={14} strokeWidth={2} />
                        }
                    </button>
                </div>
            </div>

            {/* Pulsing dot keyframe */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: scale(0.85); }
                    50%       { opacity: 1;   transform: scale(1.1);  }
                }
            `}</style>
        </div>
    )
}