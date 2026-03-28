"use client";

import { Plus, PlaySquare, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CreateLectureModal } from "./CreateLectureModal";

interface LectureSidebarProps {
    spaceId: string;
    initialLectures: { id: string; title: string }[];
    isOwner?: boolean;
}

export function LectureSidebar({ spaceId, initialLectures, isOwner = false }: LectureSidebarProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false);
    const pathname = usePathname();

    if (isMinimized) {
        return (
            <div className="w-13 h-full shrink-0 overflow-hidden bg-[var(--color-secondary)] border-r border-[var(--color-border-primary)]/30 flex flex-col">
                <div className="shrink-0 h-11 w-full flex items-center justify-center border-b border-[var(--color-border-primary)]/30">
                    <button
                        onClick={() => setIsMinimized(false)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                        title="Expand sidebar"
                    >
                        <PanelLeftOpen className="w-4 h-4" />
                    </button>
                </div>
                {isOwner && (
                    <div className="shrink-0 px-1.5 py-1.5 border-b border-[var(--color-border-primary)]/30 flex flex-col gap-1 w-full">
                        <button
                            onClick={() => setIsCreatingModalOpen(true)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 disabled:opacity-40"
                            title="New lecture"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className="flex-1 min-h-0 overflow-y-auto py-1.5 px-1.5 space-y-1 w-full">
                    {initialLectures.map(lecture => {
                        const isActive = pathname.includes(`/lectures/${lecture.id}`);
                        return (
                            <Link
                                key={lecture.id}
                                href={`/dashboard/spaces/${spaceId}/lectures/${lecture.id}`}
                                title={lecture.title}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 shrink-0 ${
                                    isActive
                                        ? "bg-[var(--color-text-primary)] text-[var(--color-text-highlight)] shadow-sm"
                                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                                }`}
                            >
                                <PlaySquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "opacity-90" : "opacity-50"}`} />
                            </Link>
                        );
                    })}
                </div>
                <CreateLectureModal spaceId={spaceId} isOpen={isCreatingModalOpen} onClose={() => setIsCreatingModalOpen(false)} />
            </div>
        );
    }

    return (
        <div className="w-60 h-full shrink-0 bg-[var(--color-secondary)] border-r border-[var(--color-border-primary)]/30 flex flex-col overflow-hidden">
            <div className="shrink-0 px-3 h-11 flex items-center justify-between border-b border-[var(--color-border-primary)]/30">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-primary)]" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                        Lectures
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {isOwner && (
                        <button
                            onClick={() => setIsCreatingModalOpen(true)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 disabled:opacity-40"
                            title="New lecture"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto py-1.5 px-2.5">
                {initialLectures.length === 0 ? (
                    <div className="mt-4 flex flex-col items-center gap-2 text-center px-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                            <PlaySquare className="w-5 h-5 text-[var(--color-text-muted)] opacity-40" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                No lectures yet
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                                Create your first lecture to get started
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {initialLectures.map((lecture) => {
                            const isActive = pathname.includes(`/lectures/${lecture.id}`);
                            return (
                                <Link
                                    key={lecture.id}
                                    href={`/dashboard/spaces/${spaceId}/lectures/${lecture.id}`}
                                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors duration-150 ${
                                        isActive
                                            ? "bg-[var(--color-text-primary)] text-[var(--color-text-highlight)] font-medium shadow-sm"
                                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                                    }`}
                                >
                                    <PlaySquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "opacity-90" : "opacity-50"}`} />
                                    <span className="truncate flex-1">{lecture.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
            <CreateLectureModal spaceId={spaceId} isOpen={isCreatingModalOpen} onClose={() => setIsCreatingModalOpen(false)} />
        </div>
    );
}
