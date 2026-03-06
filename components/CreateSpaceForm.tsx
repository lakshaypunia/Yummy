"use client";

import { createSpace } from "@/lib/actions/space.actions";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateSpaceForm() {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        const result = await createSpace(name);

        if (result.success && result.spaceId) {
            router.push(`/dashboard/spaces/${result.spaceId}`);
        } else {
            console.error(result.error);
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4 max-w-sm relative">
            <input
                type="text"
                placeholder="New space name..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]/20 focus:border-[var(--color-highlight)] shadow-sm transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={!name.trim() || isLoading}
                className="px-5 py-2.5 bg-[var(--color-highlight)] text-[var(--color-text-highlight)] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] shadow-sm transition-opacity font-medium"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </button>
        </form>
    );
}
