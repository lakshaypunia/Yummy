"use client";

import { ArrowUp, ChevronDown, Loader2, Plus, Minimize2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { useStreamingChat } from "@/hooks/useSendChat"
import ReactMarkdown from "react-markdown"

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

    // Simplified hook: No more local intent handling. 
    // The backend now manages the creation of videos/animations.
    const {
        messages: chatmessages,
        isStreaming,
        sendMessage,
    } = useStreamingChat({
        chatId,
        pageId,
        // Removed onVideoIntent and onAnimationIntent
    });

    // Auto-scroll logic remains to keep the latest messages in view
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatmessages, isDropdownOpen]);

    // Handle outside clicks for top-view dropdown
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

    // Dynamic Classes (kept your original styling)
    const containerClasses = isTop
        ? "w-1/2 left-[50%] shadow-md translate-x-[-50%] p-2 px-3 flex backdrop-blur-md bg-[var(--color-card)]/30 absolute top-3 rounded-lg z-[1000] border border-[var(--color-border-primary)]"
        : "w-full p-2 px-3 flex backdrop-blur-md bg-[var(--color-card)] rounded-lg border border-[var(--color-border-primary)] shadow-sm shrink-0";

    const dropdownClasses = isTop
        ? "w-2/3 left-[50%] translate-x-[-50%] p-4 flex backdrop-blur-md bg-[var(--color-card)]/90 shadow-lg max-h-[400px] z-[1000] absolute top-16 rounded-lg border border-[var(--color-border-primary)]"
        : "w-full flex-1 p-4 flex flex-col bg-[var(--color-card)] rounded-lg border border-[var(--color-border-primary)] overflow-hidden mb-2";

    return (
        <div className={`flex flex-col ${isTop ? "static" : "h-full w-full justify-end"}`} ref={dropdownRef}>

            {/* Collapsed Top Tab (Hidden in Side View) */}
            <AnimatePresence>
                {isTop && chatmessages.length > 0 && !isDropdownOpen && (
                    <motion.div
                        layoutId="chat-container"
                        className="w-[43%] left-[50%] translate-x-[-50%] z-[1000] border border-[var(--color-border-primary)] border-t-0 py-0.5 px-2 flex backdrop-blur-md bg-[var(--color-card)]/90 shadow-md absolute top-15 rounded-b-lg cursor-pointer"
                        onClick={() => setIsDropdownOpen(true)}
                    >
                        <div className="w-full h-full flex items-center justify-between px-3">
                            <span className="text-[var(--color-text-primary)] text-sm font-light">chat</span>
                            <ChevronDown size={16} className="text-[var(--color-text-primary)]" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Message Area */}
            {chatmessages.length > 0 && (isDropdownOpen || !isTop) && (
                <motion.div
                    layout={isTop}
                    layoutId={isTop ? "chat-container" : undefined}
                    className={dropdownClasses}
                >
                    <div ref={scrollRef} className="flex flex-col gap-3 w-full h-full overflow-y-auto pr-2 custom-scrollbar">
                        {chatmessages.map((msg: any, index: number) => {
                            if (!msg.content && msg.role === "USER") return null;
                            if (!msg.content && msg.role !== "USER" && index !== chatmessages.length - 1) return null;

                            return (
                                <div key={msg.id || index} className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}>
                                    {msg.content ? (
                                        <div className={`px-4 py-2 rounded-lg text-sm prose prose-sm max-w-none ${msg.role === "USER" ? "max-w-[80%] bg-[var(--color-primary)] border border-[var(--color-border-primary)]" : "bg-transparent w-full"}`}>
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        // Loading indicator while waiting for the backend to finish parallel tasks
                                        <div className="flex h-[38px] items-center px-4 py-2">
                                            <span className="animate-pulse bg-[var(--color-text-primary)]/60 h-2.5 w-2.5 rounded-full" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Input Bar */}
            <div className={containerClasses}>
                <div className="flex gap-1 items-center justify-between w-full">
                    {!isTop && (
                        <button onClick={onMinimizeSideChat} className="text-[var(--color-text-primary)] p-1.5 rounded-md mr-1">
                            <Minimize2 size={18} />
                        </button>
                    )}
                    {isTop && <Plus size={22} className="text-[var(--color-text-primary)] bg-[var(--color-primary)]/35 rounded-md p-0.5" />}

                    <input
                        ref={inputRef}
                        onFocus={() => setIsDropdownOpen(true)}
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        disabled={isStreaming} // Lock input during the "Big Reveal"
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter' && userQuery.trim() !== "" && !isStreaming) {
                                e.preventDefault();
                                const query = userQuery;
                                setUserQuery("");
                                await sendMessage(query);
                            }
                        }}
                        type="text"
                        placeholder={isStreaming ? "AI Brain is working..." : "Ask AI..."}
                        className="w-full bg-transparent text-sm outline-none p-1.5 disabled:opacity-50"
                    />

                    <button
                        disabled={userQuery === "" || isStreaming}
                        onClick={async () => {
                            const query = userQuery;
                            setUserQuery("");
                            await sendMessage(query);
                        }}
                    >
                        <div className="w-fit h-fit flex items-center justify-center rounded-md bg-[var(--color-primary)]/35 p-0.5">
                            {isStreaming ? (
                                <Loader2 size={22} className="animate-spin text-[var(--color-text-primary)]" />
                            ) : (
                                <ArrowUp size={22} className="text-[var(--color-text-primary)]" />
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}