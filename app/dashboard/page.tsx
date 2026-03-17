import { UserButton } from "@clerk/nextjs";
import { getSpaces } from "@/lib/actions/space.actions";
import Link from "next/link";
import { Folder } from "lucide-react";
import { CreateSpaceModal } from "@/components/CreateSpaceForm";
import { JoinSpaceModal } from "@/components/JoinSpaceModal";

export default async function Dashboard() {
    const spaces = await getSpaces();

    return (
        <div className="w-full min-h-full bg-[var(--color-background)]">
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Top bar */}
                <div className="flex items-center justify-between mb-14 pb-6 border-b border-[var(--color-border-primary)]/40">
                    <div className="flex items-center gap-2.5">
                        <div className="grid grid-cols-2 gap-[3px] w-4 h-4">
                            <span className="rounded-[2px] bg-[var(--color-text-primary)] opacity-80" />
                            <span className="rounded-[2px] bg-[var(--color-text-primary)] opacity-40" />
                            <span className="rounded-[2px] bg-[var(--color-text-primary)] opacity-40" />
                            <span className="rounded-[2px] bg-[var(--color-text-primary)] opacity-20" />
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Workspaces</span>
                    </div>
                    <UserButton />
                </div>

                {/* Page heading */}
                <div className="mb-6">
                    <h1 className="text-[22px] font-medium text-[var(--color-text-primary)] tracking-[-0.3px] mb-1">
                        Your spaces
                    </h1>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                        Manage your workspaces or create a new one to get started.
                    </p>
                </div>

                {/* Actions */}
                <div className="mb-6">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-3">
                        Actions
                    </p>
                    <div className="flex flex-wrap items-center gap-[10px]">
                        <CreateSpaceModal />
                        <div className="w-px h-6 bg-[var(--color-border-primary)]/30 flex-shrink-0" />
                        <JoinSpaceModal />
                    </div>
                </div>

                {/* Spaces grid */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                            Recent spaces
                        </p>
                        {spaces.length > 0 && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[var(--color-border-primary)]/40 bg-[var(--color-secondary)] text-[var(--color-text-muted)]">
                                {spaces.length} space{spaces.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {spaces.length === 0 ? (
                        <div className="py-14 px-6 border border-dashed border-[var(--color-border-primary)]/60 rounded-xl flex flex-col items-center gap-3 text-center bg-[var(--color-secondary)]/50">
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)] border border-[var(--color-border-primary)]/40 flex items-center justify-center mb-1">
                                <Folder className="w-[14px] h-[14px] text-[var(--color-text-muted)]" />
                            </div>
                            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">No spaces yet</h3>
                            <p className="text-sm text-[var(--color-text-muted)] max-w-[260px] leading-relaxed">
                                You haven't created any workspaces yet. Create one above to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {spaces.map((space: any) => {
                                const rootPageId = space.pages?.[0]?.id || "new";
                                const spaceHref = `/dashboard/spaces/${space.id}/pages/${rootPageId}`;
                                return (
                                    <Link
                                        key={space.id}
                                        href={spaceHref}
                                        className="group flex flex-col gap-2 p-4 rounded-xl border border-[var(--color-border-primary)]/40 bg-[var(--color-primary)] hover:border-[var(--color-border-primary)] hover:bg-[var(--color-secondary)] transition-all duration-150 cursor-pointer"
                                    >
                                        {/* Icon + Title row */}
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border-primary)]/40 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-primary)] transition-colors">
                                                <Folder className="w-[14px] h-[14px] text-[var(--color-text-muted)] opacity-60" />
                                            </div>
                                            <h4 className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                                                {space.name}
                                            </h4>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
                                            {space.description || "No description provided."}
                                        </p>

                                        {/* Meta row */}
                                        <div className="flex items-center gap-[5px] mt-auto pt-2 border-t border-[var(--color-border-primary)]/30">
                                            <span className="w-[5px] h-[5px] rounded-full bg-[var(--color-border-primary)] flex-shrink-0" />
                                            <span className="text-[11px] text-[var(--color-text-muted)]">
                                                {space.updatedAt
                                                    ? `Updated ${formatRelativeTime(space.updatedAt)}`
                                                    : "No recent activity"}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

function formatRelativeTime(date: Date | string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(days / 7);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    return `${weeks}w ago`;
}