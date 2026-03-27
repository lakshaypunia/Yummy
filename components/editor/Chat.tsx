"use client";

import { ArrowUp, ChevronDown, Loader2, Plus, Minimize2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { useStreamingChat } from "@/hooks/useSendChat"
import ReactMarkdown from "react-markdown"
import { getSpaceDocuments } from "@/lib/actions/document.actions"
import { Paperclip, X, FileText } from "lucide-react"

interface ChatProps {
    chatId: string;
    pageId: string;
    spaceId?: string;
    viewMode?: 'top' | 'side';
    onMinimizeSideChat?: () => void;
}

export default function Chat({ chatId, pageId, spaceId, viewMode = 'top', onMinimizeSideChat }: ChatProps) {
    const queryClient = useQueryClient();
    const [userQuery, setUserQuery] = useState("")

    const [isDropdownOpen, setIsDropdownOpen] = useState(true)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false)
    const [spaceDocs, setSpaceDocs] = useState<any[]>([])
    const [selectedDocs, setSelectedDocs] = useState<any[]>([])
    const [isLoadingDocs, setIsLoadingDocs] = useState(false)

    const {
        messages: chatmessages,
        isStreaming,
        sendMessage,
    } = useStreamingChat({
        chatId,
        pageId,
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

    const loadSpaceDocs = async () => {
        if (!spaceId) return;
        setIsLoadingDocs(true);
        const res = await getSpaceDocuments(spaceId);
        if (res.success && res.documents) {
            setSpaceDocs(res.documents.filter((d: any) => d.type.includes("pdf")));
        }
        setIsLoadingDocs(false);
    };

    const toggleDocSelector = async () => {
        if (!isDocSelectorOpen) {
            await loadSpaceDocs();
        }
        setIsDocSelectorOpen(!isDocSelectorOpen);
    };

    const handleSelectDoc = (doc: any) => {
        if (selectedDocs.find(d => d.id === doc.id)) {
            setSelectedDocs(selectedDocs.filter(d => d.id !== doc.id));
        } else {
            setSelectedDocs([...selectedDocs, doc]);
        }
    };

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
                                            
                                            {/* Render attachments if any */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {msg.attachments.map((doc: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-1 px-2 py-1 bg-[var(--color-background)]/50 border border-[var(--color-border-primary)]/50 rounded-md text-[10px] text-[var(--color-text-secondary)] shadow-sm">
                                                            <FileText size={10} className="text-blue-500 shrink-0" />
                                                            <span className="truncate max-w-[150px]" title={doc.name}>{doc.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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
                <div className="flex flex-col w-full">
                    {/* Render Selected Docs before sending */}
                    {selectedDocs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[var(--color-border-primary)]/30 mb-2">
                            {selectedDocs.map((doc: any, i: number) => (
                                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--color-primary)]/40 border border-[var(--color-border-primary)]/60 text-[10px] text-[var(--color-text-primary)]">
                                    <FileText size={10} className="text-blue-500 shrink-0" />
                                    <span className="truncate max-w-[120px] font-medium" title={doc.name}>{doc.name}</span>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); handleSelectDoc(doc); }}
                                        className="text-[var(--color-text-muted)] hover:text-red-400 p-0.5 rounded-full hover:bg-[var(--color-background)] transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
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

                    {/* Document attachment button */}
                    {spaceId && (
                        <div className="relative">
                            <button
                                onClick={toggleDocSelector}
                                className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 ${selectedDocs.length > 0 ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30" : "bg-[var(--color-primary)]/20 text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]/30 hover:text-[var(--color-text-primary)]"}`}
                                title="Attach PDF"
                            >
                                <Paperclip size={14} strokeWidth={2} />
                            </button>
                            
                            {/* Document Selector Dropdown */}
                            <AnimatePresence>
                                {isDocSelectorOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--color-card)] border border-[var(--color-border-primary)] rounded-xl shadow-xl z-50 overflow-hidden"
                                    >
                                        <div className="p-2 border-b border-[var(--color-border-primary)] flex justify-between items-center bg-[var(--color-primary)]/10">
                                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">Select PDFs</span>
                                            <button onClick={() => setIsDocSelectorOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="p-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                                            {isLoadingDocs ? (
                                                <div className="flex justify-center p-4">
                                                    <Loader2 size={16} className="animate-spin text-[var(--color-text-muted)]" />
                                                </div>
                                            ) : spaceDocs.length === 0 ? (
                                                <div className="text-xs text-center p-4 text-[var(--color-text-muted)]">
                                                    No PDFs found in this space.
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    {spaceDocs.map((doc) => {
                                                        const isSelected = !!selectedDocs.find(d => d.id === doc.id);
                                                        return (
                                                            <div 
                                                                key={doc.id}
                                                                onClick={() => handleSelectDoc(doc)}
                                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${isSelected ? "bg-blue-500/10 text-blue-400" : "hover:bg-[var(--color-primary)] text-[var(--color-text-primary)]"}`}
                                                            >
                                                                <FileText size={14} className={isSelected ? "text-blue-500" : "text-[var(--color-text-muted)]"} />
                                                                <span className="truncate flex-1">{doc.name}</span>
                                                                {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                                const docs = [...selectedDocs];
                                setUserQuery("");
                                setSelectedDocs([]);
                                setIsDocSelectorOpen(false);
                                await sendMessage(query, docs);
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
                            const docs = [...selectedDocs];
                            setUserQuery("");
                            setSelectedDocs([]);
                            setIsDocSelectorOpen(false);
                            await sendMessage(query, docs);
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