"use client";

import { createPage } from "@/lib/actions/page.actions";
import { ChevronLeft, ChevronRight, FileText, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface PageSidebarProps {
    spaceId: string;
    initialPages: { id: string; title: string }[];
}

export function PageSidebar({ spaceId, initialPages }: PageSidebarProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleCreatePage = async () => {
        setIsCreating(true);
        const result = await createPage(spaceId, "Untitled Page");
        if (result.success && result.pageId) {
            router.push(`/dashboard/spaces/${spaceId}/pages/${result.pageId}`);
        }
        setIsCreating(false);
    };

    if (isMinimized) {
        return (
            <div className="w-12 h-full bg-[var(--color-secondary)] border-r border-[var(--color-border-primary)] flex flex-col items-center py-4 shrink-0 transition-all duration-300 relative">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="absolute -right-3 top-6 w-6 h-6 bg-[var(--color-primary)] border border-[var(--color-border-primary)] rounded-full flex items-center justify-center hover:bg-[var(--color-background)] shadow-sm z-10"
                >
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>

                <button
                    onClick={handleCreatePage}
                    disabled={isCreating}
                    className="p-2 mb-4 hover:bg-[var(--color-primary)] rounded-lg text-[var(--color-text-muted)] disabled:opacity-50"
                    title="Create new page"
                >
                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>

                <div className="w-full px-2 flex flex-col gap-2">
                    {initialPages.map(page => (
                        <Link
                            key={page.id}
                            href={`/dashboard/spaces/${spaceId}/pages/${page.id}`}
                            className={`p-2 rounded-lg flex items-center justify-center ${pathname.includes(page.id) ? "bg-[var(--color-highlight)] text-[var(--color-text-highlight)] shadow-[0_2px_4px_rgba(0,0,0,0.1)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] transition-colors"
                                }`}
                            title={page.title}
                        >
                            <FileText className="w-5 h-5" />
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-64 h-full bg-[var(--color-secondary)] border-r border-[var(--color-border-primary)] flex flex-col shrink-0 transition-all duration-300 relative z-10">
            <button
                onClick={() => setIsMinimized(true)}
                className="absolute -right-3 top-6 w-6 h-6 bg-[var(--color-primary)] border border-[var(--color-border-primary)] rounded-full flex items-center justify-center hover:bg-[var(--color-background)] shadow-sm z-10 transition-transform hover:scale-105"
            >
                <ChevronLeft className="w-4 h-4 text-[var(--color-text-muted)]" />
            </button>

            <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-[var(--color-text-primary)]">Space Pages</h3>
                <button
                    onClick={handleCreatePage}
                    disabled={isCreating}
                    className="p-1 hover:bg-[var(--color-background)] rounded text-[var(--color-text-muted)] transition-colors disabled:opacity-50"
                    title="Create new page"
                >
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
                {initialPages.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[var(--color-text-muted)] opacity-80">
                        No pages yet. Create one!
                    </div>
                ) : (
                    initialPages.map((page) => {
                        const isActive = pathname.includes(page.id);
                        return (
                            <Link
                                key={page.id}
                                href={`/dashboard/spaces/${spaceId}/pages/${page.id}`}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive
                                    ? "bg-[var(--color-highlight)] shadow-md font-medium text-[var(--color-text-highlight)] translate-x-1"
                                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:shadow-sm border border-transparent"
                                    }`}
                            >
                                <FileText className={`w-4 h-4 shrink-0 ${isActive ? "text-[var(--color-text-highlight)]" : "text-[var(--color-text-muted)]"}`} />
                                <span className="truncate">{page.title}</span>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
