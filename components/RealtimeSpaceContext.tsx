"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useRouter } from "next/navigation";

interface RealtimeSpaceContextType {
    triggerSidebarRefresh: () => void;
    syncStatus: "syncing" | "connected" | "disconnected";
}

const RealtimeSpaceContext = createContext<RealtimeSpaceContextType | null>(null);

export function useRealtimeSpace() {
    const context = useContext(RealtimeSpaceContext);
    if (!context) {
        throw new Error("useRealtimeSpace must be used within a RealtimeSpaceProvider");
    }
    return context;
}

export function RealtimeSpaceProvider({
    spaceId,
    children
}: {
    spaceId: string;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [syncStatus, setSyncStatus] = useState<"syncing" | "connected" | "disconnected">("syncing");

    // Store Y.Doc in state or ref to keep it stable
    const [yDoc] = useState(() => new Y.Doc());

    useEffect(() => {
        // We connect to a special "Room" just for the Space's global events
        const wsProvider = new WebsocketProvider(
            "ws://localhost:1234",
            `space-${spaceId}`,
            yDoc
        );

        wsProvider.on("status", (event: { status: string }) => {
            if (event.status === "connected") {
                setSyncStatus("connected");
            } else {
                setSyncStatus("disconnected");
            }
        });

        // Listen for generic "ping" events on a shared array
        const eventsArray = yDoc.getArray("sidebar-events");

        const handleObserver = () => {
            // When ANY client pushes to this array, we trigger a Next.js server component refresh
            // This will quickly re-run getPagesForSpace in the layout without a hard reload!
            console.log("RealtimeSpaceContext: Sidebar ping received, refreshing data...");
            router.refresh();
        };

        eventsArray.observe(handleObserver);

        return () => {
            eventsArray.unobserve(handleObserver);
            wsProvider.destroy();
            yDoc.destroy();
        };
    }, [spaceId, yDoc, router]);

    const triggerSidebarRefresh = useCallback(() => {
        // Push a random timestamp/ID to trigger the observer for all connected clients
        const eventsArray = yDoc.getArray("sidebar-events");
        eventsArray.push([Date.now()]);
    }, [yDoc]);

    return (
        <RealtimeSpaceContext.Provider value={{ triggerSidebarRefresh, syncStatus }}>
            {children}
        </RealtimeSpaceContext.Provider>
    );
}
