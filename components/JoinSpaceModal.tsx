"use client";

import { joinSpace } from "@/lib/actions/space.actions";
import { Link2, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinSpaceModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [spaceId, setSpaceId] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        let finalId = spaceId.trim();
        if (finalId.includes("/join/")) {
            finalId = finalId.split("/join/")[1];
        } else if (finalId.includes("/spaces/")) {
            finalId = finalId.split("/spaces/")[1].split("/")[0];
        }

        if (!finalId) {
            setError("Please enter a valid space ID");
            return;
        }

        setIsLoading(true);
        const result = await joinSpace(finalId);

        if (result.success && result.spaceId) {
            setIsOpen(false);
            setSpaceId("");
            router.push(`/dashboard/spaces/${result.spaceId}`);
        } else {
            setError(result.error || "Failed to join space");
            setIsLoading(false);
        }
    };

    const close = () => { setIsOpen(false); setSpaceId(""); setError(""); };

    return (
        <>
            {/* Trigger Button (Matches secondary .btn) */}
            <button
                onClick={() => setIsOpen(true)}
                className="
                    inline-flex items-center gap-[7px] px-[14px] h-[36px]
                    rounded-md text-[13px] font-medium
                    bg-[var(--color-background)] text-[var(--color-text-primary)]
                    border border-[var(--color-border-primary)]
                    hover:bg-[var(--color-secondary)]
                    transition-all duration-120
                    cursor-pointer
                "
            >
                <Link2 className="w-3.5 h-3.5 opacity-75" strokeWidth={2} />
                Join with code
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
                                Join a space
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
                                    Space ID or invite link
                                </label>
                                <input
                                    type="text"
                                    placeholder="550e8400-e29b-41d4-a716..."
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
                                    value={spaceId}
                                    onChange={(e) => { setSpaceId(e.target.value); setError(""); }}
                                    disabled={isLoading}
                                    autoFocus
                                />
                                {error && (
                                    <p className="text-xs text-red-500 mt-0.5">{error}</p>
                                )}
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
                                    disabled={!spaceId.trim() || isLoading}
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
                                        : "Join space"
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