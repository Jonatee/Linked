"use client";

import { create } from "zustand";

const useUiStore = create((set) => ({
  composerOpen: false,
  feedMode: "latest",
  openComposer: () => set({ composerOpen: true }),
  closeComposer: () => set({ composerOpen: false }),
  toggleComposer: () => set((state) => ({ composerOpen: !state.composerOpen })),
  setFeedMode: (feedMode) => set({ feedMode })
}));

export default useUiStore;
