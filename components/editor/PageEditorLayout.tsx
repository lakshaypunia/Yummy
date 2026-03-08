"use client";

import { useState } from "react";
import { EditorWrapper } from "@/components/editor/EditorWrapper";
import Chat from "@/components/editor/Chat";
import { MessageSquare, LayoutPanelLeft } from "lucide-react";

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
    const [chatView, setChatView] = useState<'top' | 'side'>('top');
    const [isSideChatMinimized, setIsSideChatMinimized] = useState(false);

    return (
        <div className="flex h-full w-full relative overflow-hidden bg-[var(--color-background)]">
            {/* Main Content Area */}
            <div className={`flex flex-col h-full transition-all duration-300 ${chatView === 'side' && !isSideChatMinimized ? 'w-[70%]' : 'w-full'}`}>

                {/* Header Controls for Chat Layout Toggle */}
                <div className="absolute top-4 right-4 z-20 flex bg-[var(--color-card)] border border-[var(--color-border-primary)] rounded-lg shadow-sm p-1">
                    <button
                        onClick={() => {
                            setChatView('top');
                            setIsSideChatMinimized(false);
                        }}
                        className={`p-1.5 rounded-md transition-colors ${chatView === 'top' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-background)]'}`}
                        title="Floating Chat View"
                    >
                        <MessageSquare size={16} />
                    </button>
                    <button
                        onClick={() => {
                            setChatView('side');
                            setIsSideChatMinimized(false);
                        }}
                        className={`p-1.5 rounded-md transition-colors ${chatView === 'side' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-background)]'}`}
                        title="Side Panel Chat View"
                    >
                        <LayoutPanelLeft size={16} className="rotate-180" />
                    </button>
                </div>

                {/* Top Chat Overlay */}
                {chatView === 'top' && (
                    <div className="absolute top-[88px] left-0 w-full z-10 pointer-events-none">
                        <div className="pointer-events-auto h-0 relative">
                            <Chat chatId={chatId} pageId={pageId} viewMode="top" />
                        </div>
                    </div>
                )}

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

            {/* Side Chat Panel */}
            {chatView === 'side' && (
                <div
                    className={`h-full border-l border-[var(--color-border-primary)] bg-[var(--color-card)] transition-all duration-300 ${isSideChatMinimized ? 'w-12 items-center flex flex-col pt-4' : 'w-[30%] min-w-[300px] p-4 flex flex-col'
                        }`}
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
            )}
        </div>
    );
}
