"use client";

import { useRealtimeSpace } from "@/components/RealtimeSpaceContext";
import {
    FileText, Loader2,
    Share2, Check, PenTool, Video, Home, Mic, FolderOpen, PlaySquare
} from "lucide-react";
import { useWhiteboardStore } from "@/hooks/useWhiteboardStore";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useBroadcastStore } from "@/hooks/useBroadcastStore";
import { useUser } from "@clerk/nextjs";
import { SpaceDocumentsModal } from "@/components/SpaceDocumentsModal";
import { TranscriptModal } from "@/components/editor/TranscriptModal";

// TooltipButton copied from PageSidebar.tsx
function TooltipButton({ children, content, side = "right" }: { children: React.ReactNode; content: string; side?: "right" | "bottom" }) {
    return (
        <div className="group relative flex justify-center w-full">
            {children}
            <div className={`absolute ${side === 'right' ? 'left-full ml-3 top-1/2 -translate-y-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'} z-50 pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 ease-in-out`}>
                <div className="bg-[var(--color-background)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] px-2.5 py-1.5 rounded-md text-xs font-medium shadow-md whitespace-nowrap">
                    {content}
                    {side === 'right' && <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-r-[5px] border-r-[var(--color-border-primary)]/40" />}
                    {side === 'bottom' && <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-b-[5px] border-b-[var(--color-border-primary)]/40" />}
                </div>
            </div>
        </div>
    );
}

export function MasterSidebar({ spaceId, isOwner = false, defaultPageHref }: { spaceId: string; isOwner?: boolean; defaultPageHref?: string }) {
    const [copied, setCopied] = useState(false);
    const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
    const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const pageMatch = pathname.match(/\/pages\/([^/]+)/);
    const currentPageId = pageMatch ? pageMatch[1] : "";

    const { yDoc } = useRealtimeSpace();
    const { token, joinBroadcast, leaveBroadcast } = useBroadcastStore();
    const { user } = useUser();
    const [isStartingBroadcast, setIsStartingBroadcast] = useState(false);
    const [isBroadcastActive, setIsBroadcastActive] = useState(false);

    useEffect(() => {
        if (!yDoc) return;
        const broadcastMap = yDoc.getMap("broadcast-state");
        const updateState = () => setIsBroadcastActive(!!(broadcastMap.get("isActive") as boolean));
        broadcastMap.observe(updateState);
        updateState();
        return () => broadcastMap.unobserve(updateState);
    }, [yDoc]);

    const handleToggleBroadcast = async () => {
        if (token) {
            leaveBroadcast();
            yDoc?.getMap("broadcast-state").set("isActive", false);
        } else {
            if (!user) return;
            setIsStartingBroadcast(true);
            try {
                const publishState = isOwner;
                const res = await fetch(
                    `/api/livekit/get-token?room=space-${spaceId}&participantName=${encodeURIComponent(
                        user.id
                    )}&canPublish=${publishState}&displayName=${encodeURIComponent(
                        user.username || user.firstName || user.id
                    )}`
                );
                const data = await res.json();
                if (data.token) {
                    if (publishState) yDoc?.getMap("broadcast-state").set("isActive", true);
                    joinBroadcast(data.token, publishState, user.username || user.firstName || user.id);
                }
            } catch (err) {
                console.error("Failed to start broadcast:", err);
            } finally {
                setIsStartingBroadcast(false);
            }
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(spaceId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-14 h-full shrink-0 bg-[var(--color-background)] border-r border-[var(--color-border-primary)]/30 flex flex-col items-center py-3 z-40">
            {/* Top Navigation */}
            <div className="flex flex-col items-center gap-2 w-full px-2">
                <TooltipButton content="Files & Pages" side="right">
                    <Link href={defaultPageHref || `/dashboard/spaces/${spaceId}`} scroll={false} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 ${pathname.includes('/pages') || (!pathname.includes('/lectures') && !pathname.includes('/pages')) ? "bg-[var(--color-text-primary)] text-[var(--color-background)] shadow-sm" : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"}`}>
                        <FolderOpen className="w-5 h-5" />
                    </Link>
                </TooltipButton>

                <TooltipButton content="Lectures" side="right">
                    <Link href={`/dashboard/spaces/${spaceId}/lectures`} scroll={false} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 ${pathname.includes('/lectures') ? "bg-[var(--color-text-primary)] text-[var(--color-background)] shadow-sm" : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"}`}>
                        <PlaySquare className="w-5 h-5" />
                    </Link>
                </TooltipButton>
            </div>

            <div className="w-8 h-px bg-[var(--color-border-primary)]/30 my-3" />

            {/* Actions */}
            <div className="flex flex-col items-center gap-2 w-full px-2 flex-1">
                {isBroadcastActive && !token ? (
                    <TooltipButton content="Join broadcast" side="right">
                        <button
                            onClick={handleToggleBroadcast}
                            disabled={isStartingBroadcast}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-200/60 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-400 transition-colors duration-150 disabled:opacity-40"
                        >
                            {isStartingBroadcast ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                        </button>
                    </TooltipButton>
                ) : (isOwner || token) ? (
                    <TooltipButton content={token ? "Stop broadcast" : "Start broadcast"} side="right">
                        <button
                            onClick={handleToggleBroadcast}
                            disabled={isStartingBroadcast}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-150 disabled:opacity-40 ${
                                token
                                    ? "text-red-600 bg-red-50 border-red-200/60 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-400"
                                    : "text-[var(--color-text-muted)] border-transparent hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                            }`}
                        >
                            {isStartingBroadcast ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                        </button>
                    </TooltipButton>
                ) : null}

                <TooltipButton content="Whiteboard" side="right">
                    <button
                        onClick={() => useWhiteboardStore.getState().open()}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                    >
                        <PenTool className="w-5 h-5" />
                    </button>
                </TooltipButton>

                <TooltipButton content="Video Transcript" side="right">
                    <button
                        onClick={() => {
                            if (!currentPageId) return alert("Please open a page first");
                            setIsTranscriptModalOpen(true);
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                </TooltipButton>

                <TooltipButton content="Documents" side="right">
                    <button
                        onClick={() => setIsDocumentsModalOpen(true)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                    >
                        <FileText className="w-5 h-5" />
                    </button>
                </TooltipButton>

                <TooltipButton content={copied ? "Copied!" : "Share space"} side="right">
                    <button
                        onClick={handleShare}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 ${
                            copied
                                ? "text-emerald-600 bg-emerald-50 border border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-400"
                                : "text-[var(--color-text-muted)] border border-transparent hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                        }`}
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                    </button>
                </TooltipButton>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col items-center gap-2 w-full px-2 mt-auto">
                <TooltipButton content="Exit to dashboard" side="right">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors duration-150"
                    >
                        <Home className="w-5 h-5" />
                    </button>
                </TooltipButton>
            </div>

            {/* Modals */}
            <SpaceDocumentsModal
                spaceId={spaceId}
                isOpen={isDocumentsModalOpen}
                onClose={() => setIsDocumentsModalOpen(false)}
                userId={user?.id}
            />

            <TranscriptModal 
                isOpen={isTranscriptModalOpen}
                onClose={() => setIsTranscriptModalOpen(false)}
                pageId={currentPageId}
                spaceId={spaceId}
            />
        </div>
    );
}
