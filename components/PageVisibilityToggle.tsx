"use client";

import { useRealtimeSpace } from "@/components/RealtimeSpaceContext";
import { updatePageVisibility } from "@/lib/actions/page.actions";
import { Eye, Lock, FileEdit, ChevronDown } from "lucide-react";
import { useState } from "react";

export function PageVisibilityToggle({ pageId, initialVisibility }: { pageId: string, initialVisibility: string }) {
    const [visibility, setVisibility] = useState(initialVisibility);
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { triggerSidebarRefresh } = useRealtimeSpace();

    const handleUpdate = async (newVisibility: "PRIVATE" | "VIEW_ONLY" | "EDITABLE") => {
        setIsUpdating(true);
        setIsOpen(false);
        const res = await updatePageVisibility(pageId, newVisibility);
        if (res.success) {
            setVisibility(newVisibility);
            triggerSidebarRefresh();
        }
        setIsUpdating(false);
    };

    const getIcon = (v: string) => {
        if (v === "PRIVATE") return <Lock className="w-4 h-4 text-red-500" />;
        if (v === "VIEW_ONLY") return <Eye className="w-4 h-4 text-orange-500" />;
        return <FileEdit className="w-4 h-4 text-green-500" />;
    };

    const getLabel = (v: string) => {
        if (v === "PRIVATE") return "Private";
        if (v === "VIEW_ONLY") return "View Only";
        return "Editable";
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isUpdating}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-[var(--color-border-primary)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm ${isUpdating ? "opacity-50" : ""}`}
            >
                {getIcon(visibility)}
                <span className="text-[var(--color-text-primary)]">{getLabel(visibility)}</span>
                <ChevronDown className="w-3 h-3 text-[var(--color-text-muted)]" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--color-border-primary)] rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                            onClick={() => handleUpdate("EDITABLE")}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors group"
                        >
                            <FileEdit className="w-4 h-4 text-green-500" />
                            <div>
                                <div className="font-medium text-gray-900">Editable</div>
                                <div className="text-xs text-gray-500">Members can view and edit</div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleUpdate("VIEW_ONLY")}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors border-t border-gray-100 group"
                        >
                            <Eye className="w-4 h-4 text-orange-500" />
                            <div>
                                <div className="font-medium text-gray-900">View Only</div>
                                <div className="text-xs text-gray-500">Members can view only</div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleUpdate("PRIVATE")}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors border-t border-gray-100 group"
                        >
                            <Lock className="w-4 h-4 text-red-500" />
                            <div>
                                <div className="font-medium text-gray-900">Private</div>
                                <div className="text-xs text-gray-500">Only you have access</div>
                            </div>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
