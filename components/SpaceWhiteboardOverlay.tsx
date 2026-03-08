"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useRef } from "react";
import { useWhiteboardStore } from "@/hooks/useWhiteboardStore";
import { getSpaceWhiteboard, updateSpaceWhiteboard } from "@/lib/actions/whiteboard.actions";
import { Loader2, X, Users } from "lucide-react";
import { useExcalidrawSync } from "@/hooks/useExcalidrawSync";

const ExcalidrawWrapper = dynamic(
    async () => (await import("@/components/ExcalidrawWrapper")).default,
    { ssr: false }
);

export function SpaceWhiteboardOverlay({ spaceId }: { spaceId: string }) {
    const { isOpen, close } = useWhiteboardStore();
    const [isLoading, setIsLoading] = useState(true);
    const [initialData, setInitialData] = useState<any>(null);
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const [saveStatus, setSaveStatus] = useState<"loading" | "live" | "saving" | "error">("loading");
    const saveTimeoutRef = useRef<NodeJS.Timeout>(null);
    const { onExcalidrawChange, onPointerUpdate, provider, yElements } = useExcalidrawSync(excalidrawAPI, spaceId);

    useEffect(() => {
        if (!isOpen) return;

        let mounted = true;
        const loadWhiteboard = async () => {
            setIsLoading(true);
            const res = await getSpaceWhiteboard(spaceId);
            if (mounted && res.success && res.data) {
                const els = res.data.elements;
                const initial: any = {};

                if (Array.isArray(els) && els.length > 0) {
                    initial.elements = els;
                }
                if (res.data.appState && Object.keys(res.data.appState).length > 0) {
                    const state: any = { ...(res.data.appState as any) };
                    delete state.collaborators;
                    delete state.pastElements;
                    delete state.futureElements;
                    initial.appState = state;
                }
                if (res.data.files && Object.keys(res.data.files).length > 0) {
                    initial.files = res.data.files;
                }

                setInitialData(initial);

                // HYDRATE YJS FROM DB IF IT MUST
                // (Optional: handle initial hydration if yElements is empty when using the new hook)
                if (yElements && Array.from(yElements.keys()).length === 0 && Array.isArray(els) && els.length > 0) {
                    provider?.doc.transact(() => {
                        (els as any[]).forEach((el: any) => {
                            yElements.set(el.id, { ...el });
                        });
                    }, "local");
                }
            } else if (mounted && !res.success) {
                console.error("Failed to load whiteboard", res.error);
            }
            if (mounted) setIsLoading(false);
            setSaveStatus("live");
        };

        loadWhiteboard();
        return () => { mounted = false; };
    }, [isOpen, spaceId]);

    const lastSavedDataRef = useRef<string>("");

    const onChange = useCallback(
        (elements: readonly any[], appState: any, files: any) => {
            // First push to other clients
            onExcalidrawChange(elements as any[]);

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            // Debounce saves to PostgreSQL by 2 seconds
            saveTimeoutRef.current = setTimeout(async () => {
                const { ...restAppState } = appState;
                delete restAppState.collaborators;
                delete restAppState.pastElements;
                delete restAppState.futureElements;

                // Compare to prevent useless DB writes
                const currentDataStr = JSON.stringify({ elements, appState: restAppState });
                if (currentDataStr === lastSavedDataRef.current) return;

                setSaveStatus("saving");
                const res = await updateSpaceWhiteboard(spaceId, { elements, appState: restAppState, files });
                if (res.success) {
                    lastSavedDataRef.current = currentDataStr;
                    setSaveStatus("live");
                } else {
                    console.error("Auto-save failed:", res.error);
                    setSaveStatus("error");
                }
            }, 2000);
        },
        [spaceId, onExcalidrawChange]
    );

    // The excalidraw sync logic is now handled in `useExcalidrawSync` hook

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        }
    }, []);

    // Also close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) close();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, close]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#f8f9fa] flex flex-col w-full h-full animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-4 right-4 z-[60] flex items-center gap-4">
                {/* Auto-save status indicator */}
                <div className="text-xs font-medium px-2 py-1 rounded bg-[#f1f3f5] text-neutral-500 shadow-sm pointer-events-none transition-all border border-neutral-200 flex items-center gap-2">
                    {saveStatus === "loading" && <><Loader2 className="w-3 h-3 animate-spin" /> Connecting...</>}
                    {saveStatus === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>}
                    {saveStatus === "live" && <span className="text-green-600 font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live</span>}
                    {saveStatus === "error" && <span className="text-red-500">Sync Error</span>}
                </div>

                <div className="p-1 bg-[#f1f3f5] rounded-full shadow-sm border border-neutral-200 flex items-center gap-1 pr-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                        <Users className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-neutral-600">Space Sync</span>
                </div>

                <button
                    onClick={close}
                    className="p-2 bg-white hover:bg-neutral-100 rounded-full shadow-md border border-neutral-200 transition-colors flex items-center gap-2 pr-4 text-sm font-medium text-neutral-600"
                >
                    <X className="w-5 h-5 text-neutral-700" />
                    Close Board
                </button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p>Loading your space whiteboard...</p>
                </div>
            ) : (
                <div className="flex-1 w-full h-full relative border-t border-neutral-200">
                    <ExcalidrawWrapper
                        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
                        initialData={initialData}
                        onChange={onChange}
                        onPointerUpdate={onPointerUpdate}
                        UIOptions={{
                            canvasActions: {
                                changeViewBackgroundColor: true,
                                clearCanvas: true,
                                loadScene: false,
                                export: { saveFileToDisk: true },
                                saveAsImage: true,
                                saveToActiveFile: false,
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}
