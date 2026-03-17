"use client";

import { useRealtimeSpace } from "@/components/RealtimeSpaceContext";
import { createPage } from "@/lib/actions/page.actions";
import {
    FileText, Plus, Loader2, Lock, Eye,
    Share2, Check, PenTool, Video, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import Link from "next/link";
import { useWhiteboardStore } from "@/hooks/useWhiteboardStore";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useBroadcastStore } from "@/hooks/useBroadcastStore";
import { useUser } from "@clerk/nextjs";
import { SpaceDocumentsModal } from "@/components/SpaceDocumentsModal";

interface PageSidebarProps {
    spaceId: string;
    initialPages: { id: string; title: string; visibility?: string }[];
    isOwner?: boolean;
}

export function PageSidebar({ spaceId, initialPages, isOwner = false }: PageSidebarProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { triggerSidebarRefresh } = useRealtimeSpace();

    const handleCreatePage = async () => {
        setIsCreating(true);
        const result = await createPage(spaceId, "Untitled Page");
        if (result.success && result.pageId) {
            triggerSidebarRefresh();
            router.push(`/dashboard/spaces/${spaceId}/pages/${result.pageId}`);
        }
        setIsCreating(false);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(spaceId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getVisibilityIcon = (visibility?: string, isActive?: boolean) => {
        const cls = `w-3.5 h-3.5 shrink-0 ${isActive ? "opacity-80" : "opacity-40"}`;
        if (visibility === "PRIVATE") return <Lock className={cls} />;
        if (visibility === "VIEW_ONLY") return <Eye className={cls} />;
        return <FileText className={cls} />;
    };

    const { token, joinBroadcast, leaveBroadcast } = useBroadcastStore();
    const { user } = useUser();
    const [isStartingBroadcast, setIsStartingBroadcast] = useState(false);
    const { yDoc } = useRealtimeSpace();
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
                        user.username || user.firstName || user.id
                    )}&canPublish=${publishState}`
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

    // ── Collapsed ──────────────────────────────────────────────────
    if (isMinimized) {
        return (
            // ✅ overflow-hidden prevents page icons from spilling out
            <div className="w-12 h-full shrink-0 overflow-hidden bg-[var(--color-secondary)] border-r border-[var(--color-border-primary)]/40 flex flex-col items-center py-3 gap-1">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="w-7 h-7 mb-1 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors"
                    title="Expand sidebar"
                >
                    <PanelLeftOpen className="w-4 h-4" />
                </button>

                <button
                    onClick={handleCreatePage}
                    disabled={isCreating}
                    className="w-7 h-7 mb-2 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
                    title="New page"
                >
                    {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </button>

                {/* ✅ overflow-y-auto so page list scrolls inside the fixed sidebar */}
                <div className="flex flex-col gap-1 w-full px-1.5 overflow-y-auto flex-1 min-h-0">
                    {initialPages.map(page => {
                        const isActive = pathname.includes(page.id);
                        return (
                            <Link
                                key={page.id}
                                href={`/dashboard/spaces/${spaceId}/pages/${page.id}`}
                                title={page.title}
                                className={`w-full h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                                    isActive
                                        ? "bg-[var(--color-text-primary)] text-[var(--color-text-highlight)]"
                                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]"
                                }`}
                            >
                                {getVisibilityIcon(page.visibility, isActive)}
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Expanded ───────────────────────────────────────────────────
    return (
        <div className="w-56 h-full shrink-0 bg-[var(--color-secondary)] border-r border-[var(--color-border-primary)]/40 flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-3 h-11 shrink-0 border-b border-[var(--color-border-primary)]/40">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Pages
                </span>
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={handleCreatePage}
                        disabled={isCreating}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
                        title="New page"
                    >
                        {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Page list — scrollable middle section */}
            <div className="flex-1 min-h-0 overflow-y-auto py-2 px-2">
                {initialPages.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 text-center px-3">
                        <FileText className="w-8 h-8 text-[var(--color-text-muted)] opacity-30" />
                        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                            No pages yet.<br />Create one to get started.
                        </p>
                    </div>
                ) : (
                    initialPages.map((page) => {
                        const isActive = pathname.includes(page.id);
                        return (
                            <Link
                                key={page.id}
                                href={`/dashboard/spaces/${spaceId}/pages/${page.id}`}
                                className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-colors mb-0.5 ${
                                    isActive
                                        ? "bg-[var(--color-text-primary)] text-[var(--color-text-highlight)] font-medium"
                                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                                }`}
                            >
                                {getVisibilityIcon(page.visibility, isActive)}
                                <span className="truncate">{page.title}</span>
                            </Link>
                        );
                    })
                )}
            </div>

            {/* Footer — pinned to bottom, never grows */}
            <div className="shrink-0 border-t border-[var(--color-border-primary)]/40 p-2 flex flex-col gap-1">
                {isBroadcastActive && !token ? (
                    <SidebarButton
                        onClick={handleToggleBroadcast}
                        disabled={isStartingBroadcast}
                        icon={isStartingBroadcast ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                        label="Join broadcast"
                        variant="info"
                    />
                ) : (isOwner || token) && (
                    <SidebarButton
                        onClick={handleToggleBroadcast}
                        disabled={isStartingBroadcast}
                        icon={isStartingBroadcast ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                        label={token ? "Stop broadcast" : "Start broadcast"}
                        variant={token ? "danger" : "default"}
                    />
                )}

                <SidebarButton
                    onClick={() => useWhiteboardStore.getState().open()}
                    icon={<PenTool className="w-3.5 h-3.5" />}
                    label="Whiteboard"
                />
                <SidebarButton
                    onClick={() => setIsDocumentsModalOpen(true)}
                    icon={<FileText className="w-3.5 h-3.5" />}
                    label="Documents"
                />
                <SidebarButton
                    onClick={handleShare}
                    icon={copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    label={copied ? "Copied!" : "Share space"}
                    variant={copied ? "success" : "default"}
                />
            </div>

            <SpaceDocumentsModal
                spaceId={spaceId}
                isOpen={isDocumentsModalOpen}
                onClose={() => setIsDocumentsModalOpen(false)}
                userId={user?.id}
            />
        </div>
    );
}

// ── Reusable sidebar button ────────────────────────────────────────
type SidebarButtonVariant = "default" | "danger" | "info" | "success";

function SidebarButton({
    onClick,
    icon,
    label,
    disabled,
    variant = "default",
}: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    variant?: SidebarButtonVariant;
}) {
    const variantClasses: Record<SidebarButtonVariant, string> = {
        default: "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] border-transparent",
        danger:  "text-red-600 bg-red-50 border-red-200/60 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-400",
        info:    "text-blue-600 bg-blue-50 border-blue-200/60 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-400",
        success: "text-emerald-600 bg-emerald-50 border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-400",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium border transition-colors disabled:opacity-40 ${variantClasses[variant]}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}