"use client";

import { useRealtimeSpace } from "@/components/RealtimeSpaceContext";
import { createPage } from "@/lib/actions/page.actions";
import {
    FileText, Plus, Loader2, Lock, Eye,
    Share2, Check, PenTool, Video, PanelLeftClose, PanelLeftOpen,
    LogOut, Home
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

    const handleExit = () => {
        router.push('/dashboard');
    };

    const getVisibilityIcon = (visibility?: string, isActive?: boolean) => {
        const cls = `w-3.5 h-3.5 shrink-0 transition-opacity ${isActive ? "opacity-90" : "opacity-50"}`;
        // if (visibility === "PRIVATE") return <Lock className={cls} />;
        // if (visibility === "VIEW_ONLY") return <Eye className={cls} />;
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
                        user.id  // Use unique Clerk ID as the identity; prevents collision with other users
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

    // ── Collapsed State ──────────────────────────────────────────────────
    if (isMinimized) {
        return (
            <div className="w-13 h-full shrink-0 overflow-hidden bg-[var(--color-secondary)] border-r border-[var(--color-border-primary)]/30 flex flex-col">
                
                {/* Header with expand button */}
                <div className="shrink-0 h-11 w-full flex items-center justify-center border-b border-[var(--color-border-primary)]/30">
                    <TooltipButton content="Expand sidebar">
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                        >
                            <PanelLeftOpen className="w-4 h-4" />
                        </button>
                    </TooltipButton>
                </div>

                {/* Action buttons */}
                <div className="shrink-0 px-1.5 py-1.5 border-b border-[var(--color-border-primary)]/30 flex flex-col gap-1 w-full">
                    <TooltipButton content="New page">
                        <button
                            onClick={handleCreatePage}
                            disabled={isCreating}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 disabled:opacity-40"
                        >
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </button>
                    </TooltipButton>

                    <TooltipButton content="Exit to dashboard">
                        <button
                            onClick={handleExit}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                        >
                            <Home className="w-4 h-4" />
                        </button>
                    </TooltipButton>
                </div>

                {/* Pages list */}
                <div className="flex-1 min-h-0 overflow-y-auto py-1.5 px-1.5 space-y-1 w-full">
                    {initialPages.map(page => {
                        const isActive = pathname.includes(page.id);
                        return (
                            <TooltipButton key={page.id} content={page.title}>
                                <Link
                                    href={`/dashboard/spaces/${spaceId}/pages/${page.id}`}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 shrink-0 ${
                                        isActive
                                            ? "bg-[var(--color-text-primary)] text-[var(--color-text-highlight)] shadow-sm"
                                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                                    }`}
                                >
                                    {getVisibilityIcon(page.visibility, isActive)}
                                </Link>
                            </TooltipButton>
                        );
                    })}
                </div>

                {/* Footer actions */}
                <div className="shrink-0 border-t border-[var(--color-border-primary)]/30 px-1.5 py-1.5 flex flex-col gap-1 w-full">
                    {isBroadcastActive && !token ? (
                        <TooltipButton content="Join broadcast">
                            <button
                                onClick={handleToggleBroadcast}
                                disabled={isStartingBroadcast}
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-200/60 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-400 transition-colors duration-150 disabled:opacity-40"
                            >
                                {isStartingBroadcast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                            </button>
                        </TooltipButton>
                    ) : (isOwner || token) && (
                        <TooltipButton content={token ? "Stop broadcast" : "Start broadcast"}>
                            <button
                                onClick={handleToggleBroadcast}
                                disabled={isStartingBroadcast}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 disabled:opacity-40 ${
                                    token
                                        ? "text-red-600 bg-red-50 border border-red-200/60 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-400"
                                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                                }`}
                            >
                                {isStartingBroadcast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                            </button>
                        </TooltipButton>
                    )}

                    <TooltipButton content="Whiteboard">
                        <button
                            onClick={() => useWhiteboardStore.getState().open()}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                        >
                            <PenTool className="w-4 h-4" />
                        </button>
                    </TooltipButton>

                    <TooltipButton content="Documents">
                        <button
                            onClick={() => setIsDocumentsModalOpen(true)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                    </TooltipButton>

                    <TooltipButton content={copied ? "Copied!" : "Share space"}>
                        <button
                            onClick={handleShare}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 ${
                                copied
                                    ? "text-emerald-600 bg-emerald-50 border border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-400"
                                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                            }`}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        </button>
                    </TooltipButton>
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

    // ── Expanded State ───────────────────────────────────────────────────
    return (
        <div className="w-60 h-full shrink-0 bg-[var(--color-secondary)] border-r border-[var(--color-border-primary)]/30 flex flex-col overflow-hidden">

            {/* Header */}
            <div className="shrink-0 px-3 h-11 flex items-center justify-between border-b border-[var(--color-border-primary)]/30">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-primary)]" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                        Pages
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCreatePage}
                        disabled={isCreating}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 disabled:opacity-40"
                        title="New page"
                    >
                        {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Exit button */}
            <div className="shrink-0 px-2.5 pt-2 pb-1.5">
                <button
                    onClick={handleExit}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-primary)]/30 transition-colors duration-150"
                >
                    <Home className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                </button>
            </div>

            {/* Page list */}
            <div className="flex-1 min-h-0 overflow-y-auto py-1.5 px-2.5">
                {initialPages.length === 0 ? (
                    <div className="mt-4 flex flex-col items-center gap-2 text-center px-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[var(--color-text-muted)] opacity-40" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                No pages yet
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                                Create your first page to get started
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {initialPages.map((page) => {
                            const isActive = pathname.includes(page.id);
                            return (
                                <Link
                                    key={page.id}
                                    href={`/dashboard/spaces/${spaceId}/pages/${page.id}`}
                                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors duration-150 ${
                                        isActive
                                            ? "bg-[var(--color-text-primary)] text-[var(--color-text-highlight)] font-medium shadow-sm"
                                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                                    }`}
                                >
                                    {getVisibilityIcon(page.visibility, isActive)}
                                    <span className="truncate flex-1">{page.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer actions */}
            <div className="shrink-0 border-t border-[var(--color-border-primary)]/30 p-2 space-y-1">
                {isBroadcastActive && !token ? (
                    <SidebarButton
                        onClick={handleToggleBroadcast}
                        disabled={isStartingBroadcast}
                        icon={isStartingBroadcast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                        label="Join broadcast"
                        variant="info"
                    />
                ) : (isOwner || token) && (
                    <SidebarButton
                        onClick={handleToggleBroadcast}
                        disabled={isStartingBroadcast}
                        icon={isStartingBroadcast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                        label={token ? "Stop broadcast" : "Start broadcast"}
                        variant={token ? "danger" : "default"}
                    />
                )}

                <SidebarButton
                    onClick={() => useWhiteboardStore.getState().open()}
                    icon={<PenTool className="w-4 h-4" />}
                    label="Whiteboard"
                />
                <SidebarButton
                    onClick={() => setIsDocumentsModalOpen(true)}
                    icon={<FileText className="w-4 h-4" />}
                    label="Documents"
                />
                <SidebarButton
                    onClick={handleShare}
                    icon={copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
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

// ── Reusable Components ────────────────────────────────────────

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
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] font-medium border transition-colors duration-150 disabled:opacity-40 ${variantClasses[variant]}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

// ── CSS-Only Tooltip Component ────────────────────────────────────────

function TooltipButton({ children, content }: { children: React.ReactNode; content: string }) {
    // Replaced slow React state with pure CSS group-hover for instant, lag-free tooltips.
    return (
        <div className="group relative flex justify-center w-full">
            {children}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 ease-in-out">
                <div className="bg-[var(--color-background)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] px-2.5 py-1.5 rounded-md text-xs font-medium shadow-md whitespace-nowrap">
                    {content}
                    {/* Tooltip Triangle */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-r-[5px] border-r-[var(--color-border-primary)]/40" />
                </div>
            </div>
        </div>
    );
}