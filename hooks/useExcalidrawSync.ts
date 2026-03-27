import { useCallback, useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export const useExcalidrawSync = (excalidrawAPI: any, spaceId: string) => {
    const isRemoteUpdate = useRef(false);
    const yElementsRef = useRef<Y.Map<any> | null>(null);
    const providerRef = useRef<WebsocketProvider | null>(null);

    useEffect(() => {
        if (!excalidrawAPI) return;

        const doc = new Y.Doc();
        const wsUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "ws://localhost:1234";
        const provider = new WebsocketProvider(
            wsUrl,
            `whiteboard-${spaceId}`,
            doc
        );

        const yElements = doc.getMap("elements");
        yElementsRef.current = yElements;
        providerRef.current = provider;

        // --- 1. RECEIVING CHANGES FROM OTHERS ---
        const handleYjsChange = (event: any, transaction: any) => {
            // If we made the change locally, ignore the broadcast
            if (transaction.origin === "local") return;

            isRemoteUpdate.current = true;

            // Convert the Map values back to an array for Excalidraw
            const remoteElements = Array.from(yElements.values());

            excalidrawAPI.updateScene({
                elements: remoteElements,
                // CRITICAL: prevents remote changes from flooding your Undo/Redo stack
                commitToHistory: false,
            });

            // Reset the guard after Excalidraw finishes its internal render cycle
            setTimeout(() => {
                isRemoteUpdate.current = false;
            }, 0);
        };

        yElements.observe(handleYjsChange);

        // --- AWARENESS (POINTERS / LASER) ---
        const handleAwarenessChange = () => {
            const states = provider.awareness.getStates();
            const collaborators = new Map<string, any>();

            states.forEach((state, clientId) => {
                if (clientId !== provider.awareness.clientID && state.pointer) {
                    collaborators.set(clientId.toString(), {
                        pointer: state.pointer,
                        button: state.button || "up",
                        color: state.color || { background: "#ffc9c9", stroke: "#e03131" },
                        username: state.username || `User ${clientId}`,
                    });
                }
            });

            isRemoteUpdate.current = true;
            excalidrawAPI.updateScene({ collaborators, commitToHistory: false });
            setTimeout(() => {
                isRemoteUpdate.current = false;
            }, 0);
        };

        provider.awareness.on("change", handleAwarenessChange);

        return () => {
            provider.awareness.off("change", handleAwarenessChange);
            provider.destroy();
            doc.destroy();
        };
    }, [excalidrawAPI, spaceId]);

    // --- 2. SENDING LOCAL CHANGES TO OTHERS ---
    const onExcalidrawChange = useCallback((elements: any[]) => {
        // Stop sync if the change was triggered by an incoming remote update
        if (isRemoteUpdate.current || !yElementsRef.current) return;

        const yElements = yElementsRef.current;

        providerRef.current?.doc.transact(() => {
            // Syncing individual elements by ID
            elements.forEach((el) => {
                const existing = yElements.get(el.id);

                // Only update Yjs if the element is new or has a higher version
                // This prevents the "dot" by ensuring we only broadcast meaningful updates
                if (!existing || existing.version < el.version) {
                    // We clone the element to ensure it's a clean POJO for Yjs
                    yElements.set(el.id, { ...el });
                }
            });

            // Cleanup: If an element is deleted in Excalidraw, delete it in Yjs
            const localIds = new Set(elements.map((e) => e.id));
            Array.from(yElements.keys()).forEach((id) => {
                if (!localIds.has(id)) {
                    yElements.delete(id);
                }
            });
        }, "local"); // Mark as "local" so handleYjsChange knows to ignore it
    }, []);

    // --- 3. SENDING LOCAL POINTER / LASER TO OTHERS ---
    const onPointerUpdate = useCallback((payload: any) => {
        if (!providerRef.current) return;

        providerRef.current.awareness.setLocalStateField("pointer", payload.pointer);
        providerRef.current.awareness.setLocalStateField("button", payload.button);
    }, []);

    return { onExcalidrawChange, onPointerUpdate, provider: providerRef.current, yElements: yElementsRef.current };
};
