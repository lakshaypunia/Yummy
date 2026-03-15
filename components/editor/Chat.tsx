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

    const {
        messages: chatmessages,
        isStreaming,
        sendMessage,
    } = useStreamingChat({
        chatId,
        pageId,
        onVideoIntent: async (data: any) => {
            console.log("🎥 Video Intent Received on Web:", data);
            // Web implementation for video generation would go here
        },
        onAnimationIntent: async (data: any) => {
            console.log("🎨 Animation Intent Received on Web:", data);
            // Web implementation for p5 animation would go here
        }
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (viewMode === 'top' && chatmessages.length > 0 && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [chatmessages.length, viewMode])

    useEffect(() => {
        if (chatmessages.length > 0) {
            setIsDropdownOpen(true)
        }
    }, [chatmessages.length])

    // Auto-scroll to bottom when messages change or dropdown opens
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatmessages, isDropdownOpen]);

    const isTop = viewMode === 'top';

    const containerClasses = isTop
        ? "w-1/2 left-[50%] shadow-md translate-x-[-50%] p-2 px-3 flex backdrop-blur-md bg-[var(--color-card)]/30 absolute top-3 rounded-lg z-[1000] border border-[var(--color-border-primary)]"
        : "w-full p-2 px-3 flex backdrop-blur-md bg-[var(--color-card)] rounded-lg border border-[var(--color-border-primary)] shadow-sm shrink-0";

    const dropdownClasses = isTop
        ? "w-2/3 left-[50%] translate-x-[-50%] p-4 flex backdrop-blur-md bg-[var(--color-card)]/90 shadow-lg max-h-[400px] z-[1000] absolute top-16 rounded-lg border border-[var(--color-border-primary)]"
        : "w-full flex-1 p-4 flex flex-col bg-[var(--color-card)] rounded-lg border border-[var(--color-border-primary)] overflow-hidden mb-2";

    const collapsedClasses = isTop
        ? "w-[43%] left-[50%] translate-x-[-50%] z-[1000] border border-[var(--color-border-primary)] border-t-0 py-0.5 px-2 flex backdrop-blur-md bg-[var(--color-card)]/90 shadow-md absolute top-15 rounded-b-lg cursor-pointer"
        : "hidden"; // Side view does not have this small dropdown tab

    return (
        <div className={`flex flex-col ${isTop ? "static" : "h-full w-full justify-end"}`} ref={dropdownRef}>


            {/* Collapsed Top Tab */}
            <AnimatePresence>
                {isTop && chatmessages.length > 0 && !isDropdownOpen && (
                    <motion.div
                        layoutId="chat-container"
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 40
                        }}
                        className={collapsedClasses}
                        onClick={() => setIsDropdownOpen(true)}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: 0.4 }}
                            className="w-full h-full flex items-center justify-between px-3"
                        >
                            <span className="text-[var(--color-text-primary)] text-sm font-light w-full text-start">chat</span>
                            <span className="text-[var(--color-text-primary)] text-sm font-light w-full text-end flex justify-end items-center"><ChevronDown size={16} /></span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Messages */}
            {chatmessages.length > 0 && (isDropdownOpen || !isTop) && (
                <motion.div
                    layout={isTop}
                    layoutId={isTop ? "chat-container" : undefined}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                    }}
                    className={dropdownClasses}
                >
                    <motion.div
                        initial={isTop ? { opacity: 0 } : undefined}
                        animate={isTop ? { opacity: 1 } : undefined}
                        exit={isTop ? { opacity: 0 } : undefined}
                        transition={{ duration: 0.15, delay: 0.1 }}
                        ref={scrollRef}
                        className="flex flex-col gap-3 w-full h-full overflow-y-auto pr-2 custom-scrollbar"
                    >
                        {chatmessages.map((msg: any, index: number) => {
                            // Hide user messages if they are empty
                            if (!msg.content && msg.role === "USER") return null;
                            
                            // For AI messages, only show the loading indicator if it's the very last message in the chat
                            // Otherwise, if it's an old empty message, don't show anything
                            if (!msg.content && msg.role !== "USER" && index !== chatmessages.length - 1) return null;
                            
                            return (
                                <div key={msg.id} className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}>
                                    {msg.content ? (
                                        <div className={`px-4 py-2 rounded-lg text-sm prose prose-sm max-w-none min-h-[38px] ${msg.role === "USER" ? "max-w-[80%] bg-[var(--color-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)]" : "bg-transparent w-full text-[var(--color-text-primary)]"}`}>
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="flex h-[38px] items-center px-4 py-2">
                                            <span className="animate-pulse bg-[var(--color-text-primary)]/60 inline-block h-2.5 w-2.5 rounded-full"></span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </motion.div>
                </motion.div>
            )}

            {/* Input Area */}
            <div className={containerClasses}>
                <div className="flex gap-1 items-center justify-between w-full">
                    {/* Minimize button for Side View */}
                    {!isTop && (
                        <button
                            type="button"
                            onClick={onMinimizeSideChat}
                            className="text-[var(--color-text-primary)] hover:bg-[var(--color-primary)]/20 p-1.5 rounded-md transition-colors mr-1"
                            title="Minimize Chat"
                        >
                            <Minimize2 size={18} />
                        </button>
                    )}
                    {isTop && (
                        <Plus size={22} className="text-[var(--color-text-primary)] cursor-pointer bg-[var(--color-primary)]/35 rounded-md p-0.5 transition-all duration-150 ease-in" />
                    )}

                    <input
                        ref={inputRef}
                        onFocus={() => setIsDropdownOpen(true)}
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter' && userQuery.trim() !== "" && !isStreaming) {
                                e.preventDefault();
                                const query = userQuery;
                                setUserQuery("");
                                await sendMessage(query);
                            }
                        }}
                        type="text"
                        placeholder="Ask AI..."
                        className="w-full bg-transparent text-[var(--color-text-primary)] font-light text-sm outline-none placeholder:text-[var(--color-text-muted)] p-1.5 rounded-lg"
                    />

                    <button
                        disabled={userQuery === "" || isStreaming}
                        className="text-[var(--color-text-primary)] group disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={async () => {
                            const query = userQuery;
                            setUserQuery("");
                            await sendMessage(query);
                        }}
                    >
                        <div className="w-fit h-fit flex items-center justify-center rounded-md bg-[var(--color-primary)]/35 group-disabled:bg-[var(--color-primary)]/10 transition-all duration-150 ease-in ">
                            {isStreaming ? (
                                <Loader2 size={22} className="animate-spin text-[var(--color-text-primary)]" />
                            ) : (
                                <ArrowUp size={22} className="cursor-pointer text-[var(--color-text-primary)] transition-all duration-150 ease-in p-0.5 rounded-md" />
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
