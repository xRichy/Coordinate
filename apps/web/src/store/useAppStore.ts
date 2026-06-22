import { create } from "zustand";

// UI-only state — server data now lives in TanStack Query via tRPC.
// Add ephemeral UI state here (e.g. sidebar collapsed, selected rows).

// placeholder — expand as UI state grows (e.g. sidebar collapsed, selected rows)
type AppState = Record<string, never>;

export const useAppStore = create<AppState>(() => ({}));
