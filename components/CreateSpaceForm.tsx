"use client";

import { createSpace } from "@/lib/actions/space.actions";
import { Plus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateSpaceModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        const result = await createSpace(name);

        if (result.success && result.spaceId) {
            setIsOpen(false);
            setName("");
            router.push(`/dashboard/spaces/${result.spaceId}`);
        } else {
            console.error(result.error);
            setIsLoading(false);
        }
    };

    const close = () => { setIsOpen(false); setName(""); };

    return (
        <>
            {/* Trigger Button (Matches .btn-primary) */}
            <button
                onClick={() => setIsOpen(true)}
                className="
                    inline-flex items-center gap-[7px] px-[14px] h-[36px]
                    rounded-md text-[13px] font-medium
                    bg-[var(--color-text-primary)] text-[var(--color-background)]
                    border border-[var(--color-text-primary)]
                    hover:opacity-90 transition-all duration-120
                    cursor-pointer
                "
            >
                <Plus className="w-3.5 h-3.5 opacity-75" strokeWidth={2.5} />
                New space
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
                    onClick={(e) => e.target === e.currentTarget && close()}
                >
                    <div className="
                        bg-[var(--color-background)] w-full max-w-sm rounded-xl overflow-hidden
                        border border-[var(--color-border-primary)]
                        shadow-[0_8px_40px_rgba(0,0,0,0.12)]
                        animate-in fade-in zoom-in-95 duration-150
                    ">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-primary)]">
                            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                                Create a new space
                            </h3>
                            <button
                                onClick={close}
                                className="
                                    w-6 h-6 rounded-md flex items-center justify-center
                                    text-[var(--color-text-muted)]
                                    hover:text-[var(--color-text-primary)]
                                    hover:bg-[var(--color-secondary)]
                                    transition-colors duration-150
                                "
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-[var(--color-text-muted)]">
                                    Space name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Engineering Docs"
                                    className="
                                        h-9 px-3 rounded-lg text-sm
                                        border border-[var(--color-border-primary)]
                                        bg-[var(--color-primary)]
                                        text-[var(--color-text-primary)]
                                        placeholder:text-[var(--color-text-muted)]
                                        focus:outline-none focus:border-[var(--color-text-muted)]
                                        transition-colors duration-150
                                        disabled:opacity-50
                                    "
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            {/* Footer actions */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={close}
                                    disabled={isLoading}
                                    className="
                                        flex-1 h-9 rounded-lg text-sm font-medium
                                        border border-[var(--color-border-primary)]
                                        bg-[var(--color-primary)]
                                        text-[var(--color-text-primary)]
                                        hover:bg-[var(--color-secondary)]
                                        disabled:opacity-40
                                        transition-colors duration-150
                                    "
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!name.trim() || isLoading}
                                    className="
                                        flex-1 h-9 rounded-lg text-sm font-medium
                                        flex items-center justify-center
                                        bg-[var(--color-text-primary)] text-[var(--color-background)]
                                        hover:opacity-85 active:opacity-75 active:scale-[0.98]
                                        disabled:opacity-35 disabled:cursor-not-allowed
                                        transition-all duration-150
                                    "
                                >
                                    {isLoading
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : "Create space"
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}