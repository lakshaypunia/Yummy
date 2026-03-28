"use client";

import { useRealtimeSpace } from "@/components/RealtimeSpaceContext";
import { createPage } from "@/lib/actions/page.actions";
import {
    FileText, Plus, Loader2, Lock, Eye,
    PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface PageSidebarProps {
    spaceId: string;
    initialPages: { id: string; title: string; visibility?: string }[];
    isOwner?: boolean;
}

export function PageSidebar({ spaceId, initialPages, isOwner = false }: PageSidebarProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
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

    const getVisibilityIcon = (visibility?: string, isActive?: boolean) => {
        const cls = `w-3.5 h-3.5 shrink-0 transition-opacity ${isActive ? "opacity-90" : "opacity-50"}`;
        return <FileText className={cls} />;
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
        </div>
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