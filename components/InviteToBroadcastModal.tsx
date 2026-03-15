"use client";

import { useBroadcastStore } from "@/hooks/useBroadcastStore";
import { UserPlus, X, Check } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export function InviteToBroadcastModal({ spaceId }: { spaceId: string }) {
    const { isReceivingInvite, joinBroadcast, setPendingInvite } = useBroadcastStore();
    const [isAccepting, setIsAccepting] = useState(false);
    const { user } = useUser();

    if (!isReceivingInvite || !user) return null;

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            // Get a new token with publishing rights
            const res = await fetch(
                `/api/livekit/get-token?room=space-${spaceId}&participantName=${encodeURIComponent(
                    user.username || user.firstName || user.id
                )}&canPublish=true`
            );
            const data = await res.json();

            if (data.token) {
                // Must disconnect to upgrade permissions cleanly
                const { leaveBroadcast, joinBroadcast } = useBroadcastStore.getState();
                leaveBroadcast();
                
                setTimeout(() => {
                    joinBroadcast(data.token, true, user.username || user.firstName || user.id);
                }, 500);
            }
        } catch (error) {
            console.error("Failed to accept invite:", error);
        } finally {
            setIsAccepting(false);
            setPendingInvite(null); // Close modal
        }
    };

    const handleDecline = () => {
        setPendingInvite(null);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-neutral-200 dark:border-neutral-800">
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                        <UserPlus className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                        Broadcast Invitation
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6">
                        <strong className="text-neutral-900 dark:text-neutral-200">{isReceivingInvite.from}</strong> has invited you to turn on your camera and microphone to co-host the Live Broadcast.
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDecline}
                            disabled={isAccepting}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={isAccepting}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition flex items-center justify-center gap-2"
                        >
                            {isAccepting ? (
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Accept & Join
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
