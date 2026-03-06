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

        // Basic cleanup of input in case they pasted a full URL
        let finalId = spaceId.trim();
        if (finalId.includes("/join/")) {
            finalId = finalId.split("/join/")[1];
        } else if (finalId.includes("/spaces/")) {
            finalId = finalId.split("/spaces/")[1].split("/")[0]; // extract ID from URL
        }

        if (!finalId) {
            setError("Please enter a valid Space ID");
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

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="mt-4 px-5 py-2.5 ml-2 border border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary)] rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
            >
                <Link2 className="w-4 h-4" /> Join Space
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-[var(--color-background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[var(--color-border-primary)] animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border-primary)]">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Join a Space</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-primary)] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                                    Space ID or Invite Link
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]/20 focus:border-[var(--color-highlight)] transition-all"
                                    value={spaceId}
                                    onChange={(e) => {
                                        setSpaceId(e.target.value);
                                        setError("");
                                    }}
                                    disabled={isLoading}
                                    autoFocus
                                />
                                {error && (
                                    <p className="text-red-500 text-sm mt-2">{error}</p>
                                )}
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary)] rounded-xl font-medium transition-colors"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!spaceId.trim() || isLoading}
                                    className="flex-1 px-4 py-2.5 bg-[var(--color-highlight)] text-[var(--color-text-highlight)] rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium shadow-sm transition-opacity"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join Space"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
