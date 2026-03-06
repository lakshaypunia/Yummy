import { UserButton } from "@clerk/nextjs";
import { getSpaces } from "@/lib/actions/space.actions";
import Link from "next/link";
import { Folder } from "lucide-react";
import { CreateSpaceForm } from "@/components/CreateSpaceForm";

export default async function Dashboard() {
    // Basic query to fetch real spaces
    const spaces = await getSpaces();

    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col bg-[var(--color-background)]">
            <div className="max-w-6xl w-full mx-auto">
                <div className="flex flex-col gap-1 mb-8">
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Your Spaces</h2>
                    <p className="text-[var(--color-text-muted)]">Create a new workspace or select an existing one to continue.</p>
                </div>

                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Create New</h3>
                    <CreateSpaceForm />
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Recent Spaces</h3>

                    {spaces.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-[var(--color-border-primary)] rounded-2xl flex flex-col items-center justify-center text-center bg-[var(--color-primary)]/50">
                            <div className="w-16 h-16 bg-[var(--color-secondary)] rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <Folder className="w-8 h-8 text-[var(--color-text-muted)]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">No spaces found</h3>
                            <p className="text-[var(--color-text-muted)] max-w-sm">You haven't created any workspaces yet. Create one above to get started.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {spaces.map((space: any) => {
                                // Default to the first page if it exists in the relation
                                const rootPageId = space.pages?.[0]?.id || "new";
                                const spaceHref = `/dashboard/spaces/${space.id}/pages/${rootPageId}`;

                                return (
                                    <Link
                                        key={space.id}
                                        href={spaceHref}
                                        className="group p-5 rounded-2xl border border-[var(--color-border-primary)] hover:border-[var(--color-highlight)] hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer bg-[var(--color-primary)] shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2.5 rounded-xl bg-[var(--color-secondary)] text-[var(--color-text-primary)] group-hover:bg-[var(--color-highlight)] group-hover:text-[var(--color-text-highlight)] transition-colors shadow-sm">
                                                <Folder className="w-5 h-5" />
                                            </div>
                                            <h4 className="font-semibold text-[var(--color-text-primary)] truncate flex-1" title={space.name}>
                                                {space.name}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mt-auto">
                                            {space.description || "No description provided."}
                                        </p>
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
