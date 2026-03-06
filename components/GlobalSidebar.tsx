"use client";

import { Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export function GlobalSidebar() {
    const pathname = usePathname();
    const isHomeActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

    return (
        <div className="w-16 h-full bg-[var(--color-secondary)] border-r border-[var(--color-border-primary)] flex flex-col items-center py-6 shrink-0 z-50 relative">
            <Link
                href="/dashboard"
                className={`p-3 rounded-xl transition-all duration-200 ${isHomeActive
                        ? "bg-[var(--color-highlight)] text-[var(--color-text-highlight)] shadow-sm"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-primary)]/50"
                    }`}
                title="Home"
            >
                <Home className="w-6 h-6" />
            </Link>

            <div className="mt-auto flex items-center justify-center p-3">
                <UserButton
                    appearance={{
                        elements: {
                            userButtonAvatarBox: "w-8 h-8 rounded-lg shadow-sm",
                            userButtonTrigger: "hover:scale-105 transition-transform"
                        }
                    }}
                />
            </div>
        </div>
    );
}
