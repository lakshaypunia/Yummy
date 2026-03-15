"use client";

import { useState, useRef, useEffect } from "react";
import { EditorWrapper } from "@/components/editor/EditorWrapper";
import Chat from "@/components/editor/Chat";
import { MessageSquare } from "lucide-react";

interface PageEditorLayoutProps {
    pageId: string;
    chatId: string;
    initialTitle: string;
    initialContent?: any[];
    editable?: boolean;
}

export function PageEditorLayout({
    pageId,
    chatId,
    initialTitle,
    initialContent,
    editable = true,
}: PageEditorLayoutProps) {
    const [isSideChatMinimized, setIsSideChatMinimized] = useState(false);
    const [chatWidthPercent, setChatWidthPercent] = useState(30);
    const [isDragging, setIsDragging] = useState(false);
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
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    return (
        <div ref={containerRef} className="flex h-full w-full relative overflow-hidden bg-[var(--color-background)]">
            {/* Main Content Area */}
            <div 
                className={`flex flex-col h-full ${isDragging ? '' : 'transition-all duration-300'}`} 
                style={{ width: !isSideChatMinimized ? `${100 - chatWidthPercent}%` : '100%' }}
            >
                {/* Editor Container */}
                <div className="flex-1 w-full relative overflow-hidden">
                    <EditorWrapper
                        pageId={pageId}
                        initialTitle={initialTitle}
                        initialContent={initialContent}
                        editable={editable}
                    />
                </div>
            </div>

            {/* Resizer Handle */}
            {!isSideChatMinimized && (
                <div 
                    className="absolute top-0 bottom-0 w-2 cursor-col-resize hover:bg-[var(--color-primary)]/20 active:bg-[var(--color-primary)]/30 transition-colors z-10 flex flex-col justify-center items-center group transform -translate-x-1/2"
                    style={{ left: `${100 - chatWidthPercent}%` }}
                    onMouseDown={handleMouseDown}
                >
                    <div className="h-10 w-1 rounded-full bg-[var(--color-border-primary)] group-hover:bg-[var(--color-primary)] transition-colors"></div>
                </div>
            )}

            {/* Side Chat Panel */}
            <div
                className={`h-full border-l border-[var(--color-border-primary)] bg-[var(--color-card)] ${isDragging ? '' : 'transition-all duration-300'} ${isSideChatMinimized ? 'w-12 items-center flex flex-col pt-4 shrink-0' : 'p-4 flex flex-col shrink-0'}`}
                style={{ width: !isSideChatMinimized ? `${chatWidthPercent}%` : undefined }}
            >
                {isSideChatMinimized ? (
                    <button
                        onClick={() => setIsSideChatMinimized(false)}
                        className="bg-[var(--color-primary)] text-white p-2 rounded-full hover:shadow-lg transition-all"
                        title="Open Chat"
                    >
                        <MessageSquare size={20} />
                    </button>
                ) : (
                    <Chat
                        chatId={chatId}
                        pageId={pageId}
                        viewMode="side"
                        onMinimizeSideChat={() => setIsSideChatMinimized(true)}
                    />
                )}
            </div>
        </div>
    );
}
