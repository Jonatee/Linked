"use client";

import { create } from "zustand";

const useUiStore = create((set) => ({
  composerOpen: false,
  feedMode: "latest",
  confirmModal: {
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
    destructive: false,
    loading: false
  },
  openComposer: () => set({ composerOpen: true }),
  closeComposer: () => set({ composerOpen: false }),
  toggleComposer: () => set((state) => ({ composerOpen: !state.composerOpen })),
  setFeedMode: (feedMode) => set({ feedMode }),
  openConfirmModal: (config) => set({ 
    confirmModal: { 
      isOpen: true, 
      title: "",
      message: "",
      onConfirm: null,
      confirmText: "Confirm",
      cancelText: "Cancel",
      destructive: false,
      loading: false,
      ...config 
    } 
  }),
  closeConfirmModal: () => set((state) => ({ 
    confirmModal: { ...state.confirmModal, isOpen: false, loading: false } 
  })),
  setConfirmModalLoading: (loading) => set((state) => ({ 
    confirmModal: { ...state.confirmModal, loading } 
  }))
}));

export default useUiStore;
