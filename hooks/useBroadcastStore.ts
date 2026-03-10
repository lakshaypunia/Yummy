import { create } from "zustand";

interface BroadcastState {
    token: string | null;
    canPublish: boolean;
    participantName: string | null;
    isReceivingInvite: {
        from: string;
        isInvited: boolean;
    } | null;
    joinBroadcast: (token: string, canPublish: boolean, participantName: string) => void;
    leaveBroadcast: () => void;
    setPendingInvite: (from: string | null) => void;
}

export const useBroadcastStore = create<BroadcastState>((set) => ({
    token: null,
    canPublish: false,
    participantName: null,
    isReceivingInvite: null,
    joinBroadcast: (token, canPublish, participantName) =>
        set({ token, canPublish, participantName, isReceivingInvite: null }),
    leaveBroadcast: () =>
        set({ token: null, canPublish: false, participantName: null, isReceivingInvite: null }),
    setPendingInvite: (from) =>
        set({
            isReceivingInvite: from ? { from, isInvited: true } : null,
        }),
}));
