"use client";

import { create } from "zustand";

const defaultConfirmModal = {
  isOpen: false,
  title: "",
  message: "",
  content: null,
  onConfirm: null,
  onClose: null,
  confirmText: "Confirm",
  cancelText: "Cancel",
  destructive: false,
  loading: false,
  confirmDisabled: false
};

const useUiStore = create((set) => ({
  composerOpen: false,
  feedMode: "latest",
  confirmModal: defaultConfirmModal,
  openComposer: () => set({ composerOpen: true }),
  closeComposer: () => set({ composerOpen: false }),
  toggleComposer: () => set((state) => ({ composerOpen: !state.composerOpen })),
  setFeedMode: (feedMode) => set({ feedMode }),
  openConfirmModal: (config) =>
    set({
      confirmModal: {
        ...defaultConfirmModal,
        isOpen: true,
        ...config
      }
    }),
  updateConfirmModal: (config) =>
    set((state) => ({
      confirmModal: {
        ...state.confirmModal,
        ...config
      }
    })),
  closeConfirmModal: () =>
    set((state) => ({
      confirmModal: { ...state.confirmModal, isOpen: false, loading: false }
    })),
  resetConfirmModal: () => set({ confirmModal: defaultConfirmModal }),
  setConfirmModalLoading: (loading) =>
    set((state) => ({
      confirmModal: { ...state.confirmModal, loading }
    }))
}));

export default useUiStore;
