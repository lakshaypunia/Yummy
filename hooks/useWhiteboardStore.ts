import { create } from 'zustand';

interface WhiteboardState {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
