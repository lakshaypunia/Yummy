import { GlobalSidebar } from "@/components/GlobalSidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-[var(--color-background)] overflow-hidden">
            {/* 1. Global Sidebar (Always Visible leftmost) */}
            <GlobalSidebar />

            {/* 2. Main Area (Changes depending on route) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <main className="flex-1 overflow-auto relative flex">
                    {children}
                </main>
            </div>
        </div>
    );
}
