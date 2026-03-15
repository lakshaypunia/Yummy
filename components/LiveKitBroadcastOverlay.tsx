"use client";

import { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import {
    LiveKitRoom,
    ParticipantTile,
    useParticipants,
    useLocalParticipant,
    useConnectionState,
    useTracks,
    useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, Participant, Track, RoomEvent } from "livekit-client";
import { useBroadcastStore } from "@/hooks/useBroadcastStore";
import { X, Mic, MicOff, Video, VideoOff, Users, UserPlus, UserMinus } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRealtimeSpace } from "@/components/RealtimeSpaceContext";

export function LiveKitBroadcastOverlay({ spaceId }: { spaceId: string }) {
    const { token, canPublish, participantName, leaveBroadcast, joinBroadcast } = useBroadcastStore();
    const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(true);

    const { user } = useUser();



    const { yDoc } = useRealtimeSpace();
    const [isBroadcastActive, setIsBroadcastActive] = useState(false);

    useEffect(() => {
        if (!yDoc) return;
        const broadcastMap = yDoc.getMap("broadcast-state");

        const updateState = () => {
            const active = broadcastMap.get("isActive") as boolean;
            setIsBroadcastActive(!!active);
        };

        broadcastMap.observe(updateState);
        updateState();

        return () => {
            broadcastMap.unobserve(updateState);
        };
    }, [yDoc]);

    if (!token) return null;

    // Only render the overlay content if broadcast is actually active or we are publishers
    if (!isBroadcastActive && !canPublish) return null;

    return (
        <LiveKitRoom
            video={cameraEnabled && canPublish}
            audio={microphoneEnabled && canPublish}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            data-lk-theme="default"
            className="pointer-events-none"
            onDisconnected={leaveBroadcast}
        >
            <DraggableOverlay
                canPublish={canPublish}
                microphoneEnabled={microphoneEnabled}
                setMicrophoneEnabled={setMicrophoneEnabled}
                cameraEnabled={cameraEnabled}
                setCameraEnabled={setCameraEnabled}
                leave={() => {
                   if(canPublish) {
                       yDoc?.getMap("broadcast-state").set("isActive", false);
                   }
                   leaveBroadcast();
                }}
                spaceId={spaceId}
                user={user}
            />
        </LiveKitRoom>
    );
}

function DraggableOverlay({
    canPublish,
    microphoneEnabled,
    setMicrophoneEnabled,
    cameraEnabled,
    setCameraEnabled,
    leave,
    spaceId,
    user
}: any) {
    const connectionState = useConnectionState();
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const [showParticipants, setShowParticipants] = useState(false);
    const dragRef = useRef(null);
    const room = useRoomContext();
    const { setPendingInvite, joinBroadcast } = useBroadcastStore();

    const cameraTracks = useTracks([
        { source: Track.Source.Camera, withPlaceholder: true },
        { source: Track.Source.ScreenShare, withPlaceholder: false }
    ]);

    // Listen for peer-to-peer data channel messages (INVITE and KICK)
    useEffect(() => {
        if (!room) return;
        const handleDataReceived = (payload: Uint8Array) => {
            const str = new TextDecoder().decode(payload);
            try {
                const data = JSON.parse(str);
                if (data.type === "INVITE") {
                    setPendingInvite(data.fromName);
                } else if (data.type === "KICK_BROADCAST") {
                    // Revert to viewer
                    if (user) {
                        fetch(`/api/livekit/get-token?room=space-${spaceId}&participantName=${encodeURIComponent(
                            user.username || user.firstName || user.id
                        )}&canPublish=false`)
                            .then(res => res.json())
                            .then(data => {
                                if (data.token) {
                                    joinBroadcast(data.token, false, user.username || user.firstName || user.id);
                                }
                            });
                    }
                }
            } catch (error) {
                console.error("Failed to parse data message", error);
            }
        };

        room.on(RoomEvent.DataReceived, handleDataReceived);
        return () => {
            room.off(RoomEvent.DataReceived, handleDataReceived);
        };
    }, [room, user, spaceId, joinBroadcast, setPendingInvite]);

    // We only show participants that actually exist
    const remoteParticipants = participants.filter((p) => p.identity !== localParticipant.identity);

    // Find users currently publishing
    const publishingParticipants = participants.filter((p) => p.isSpeaking || p.isCameraEnabled || p.isMicrophoneEnabled || p.permissions?.canPublish);

    // Helper to send a data message to a specific user
    const inviteParticipant = async (targetParticipant: Participant) => {
        try {
            const payload = JSON.stringify({
                type: "INVITE",
                fromIdentity: localParticipant.identity,
                fromName: localParticipant.name || localParticipant.identity,
                spaceId: spaceId
            });

            await localParticipant.publishData(new TextEncoder().encode(payload), {
                reliable: true,
                destinationIdentities: [targetParticipant.identity]
            });
        } catch (error) {
            console.error("Failed to send invite", error);
        }
    };

    // Helper to remove a user from broadcast
    const kickParticipant = async (targetParticipant: Participant) => {
        try {
            const payload = JSON.stringify({
                type: "KICK_BROADCAST",
                fromIdentity: localParticipant.identity
            });

            await localParticipant.publishData(new TextEncoder().encode(payload), {
                reliable: true,
                destinationIdentities: [targetParticipant.identity]
            });
        } catch (error) {
            console.error("Failed to kick participant", error);
        }
    };

    return (
        <Draggable nodeRef={dragRef} bounds="body">
            <div
                ref={dragRef}
                className="fixed z-[100] bottom-6 left-6 w-80 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-700 overflow-hidden pointer-events-auto flex flex-col"
            >
                {/* Header */}
                <div className="bg-neutral-800 px-4 py-2 flex items-center justify-between cursor-move">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                        <span
                            className={`w-2 h-2 rounded-full ${connectionState === ConnectionState.Connected ? "bg-green-500" : "bg-neutral-500"
                                }`}
                        />
                        Live Broadcast
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowParticipants(!showParticipants)}
                            className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition"
                            title="Participants"
                        >
                            <Users className="w-4 h-4" />
                        </button>
                        <button
                            onClick={leave}
                            className="p-1 hover:bg-red-500/20 rounded text-neutral-400 hover:text-red-400 transition"
                            title="Leave"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Video Area */}
                <div className="relative bg-black min-h-[160px] flex items-center justify-center p-2">
                    {publishingParticipants.length === 0 && !canPublish ? (
                        <div className="text-neutral-500 text-xs text-center">
                            Waiting for someone to
                            <br />
                            start broadcasting...
                        </div>
                    ) : (
                        <div
                            className={`grid gap-2 w-full ${publishingParticipants.length > 1 ? "grid-cols-2" : "grid-cols-1"
                                }`}
                        >
                            {cameraTracks.map((track) => {
                                // "don't show the user to the broadcaster until he is not asked to braodcast even the switched off video as well"
                                // If they are NOT a publisher, hide their tile completely.
                                if (!track.participant.permissions?.canPublish) {
                                    return null;
                                }

                                return (
                                    <div key={track.participant.identity + "_" + track.source} className="relative aspect-video bg-neutral-800 rounded-lg overflow-hidden flex items-center justify-center">
                                        <ParticipantTile
                                            trackRef={track}
                                            className="w-full h-full [&>video]:object-cover"
                                            disableSpeakingIndicator={true}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Controls */}
                {canPublish && (
                    <div className="bg-neutral-800 px-4 py-3 flex items-center justify-center gap-4">
                        <button
                            onClick={() => setMicrophoneEnabled(!microphoneEnabled)}
                            className={`p-3 rounded-full transition ${microphoneEnabled ? "bg-neutral-700 hover:bg-neutral-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                                }`}
                        >
                            {microphoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setCameraEnabled(!cameraEnabled)}
                            className={`p-3 rounded-full transition ${cameraEnabled ? "bg-neutral-700 hover:bg-neutral-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                                }`}
                        >
                            {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </button>
                    </div>
                )}

                {/* Participant List & Invites */}
                {showParticipants && (
                    <div className="bg-neutral-900 border-t border-neutral-800 p-3 max-h-48 overflow-y-auto">
                        <h4 className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">
                            In Room ({participants.length})
                        </h4>
                        <div className="space-y-1">
                            {participants.map((p) => {
                                const isMe = p.identity === localParticipant.identity;
                                const canInvite = !isMe && !p.permissions?.canPublish && canPublish;
                                const canKick = !isMe && p.permissions?.canPublish && canPublish;

                                return (
                                    <div key={p.identity} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-neutral-800 group">
                                        <span className="text-sm text-neutral-200 truncate flex-1 flex items-center gap-2">
                                            {p.name || p.identity} {isMe && "(You)"}
                                            {p.permissions?.canPublish && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Broadcasting" />
                                            )}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canInvite && (
                                                <button
                                                    onClick={() => inviteParticipant(p)}
                                                    className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition flex items-center gap-1 text-[10px] font-medium"
                                                >
                                                    <UserPlus className="w-3 h-3" />
                                                    Ask to Join
                                                </button>
                                            )}
                                            {canKick && (
                                                <button
                                                    onClick={() => kickParticipant(p)}
                                                    className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition flex items-center gap-1 text-[10px] font-medium"
                                                    title="Remove from Broadcast"
                                                >
                                                    <UserMinus className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </Draggable>
    );
}
