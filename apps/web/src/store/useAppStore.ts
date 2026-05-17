import { create } from "zustand";

// UI-only state — server data now lives in TanStack Query via tRPC.
// Add ephemeral UI state here (e.g. sidebar collapsed, selected rows).

interface AppState {
    // placeholder — expand as UI state grows
}

export const useAppStore = create<AppState>(() => ({}));
