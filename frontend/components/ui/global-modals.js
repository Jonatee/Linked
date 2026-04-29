"use client";

import { ConfirmModal } from "@/components/ui/modal";
import useUiStore from "@/stores/ui-store";

export default function GlobalModals() {
  const { confirmModal, closeConfirmModal, resetConfirmModal, setConfirmModalLoading } = useUiStore();

  const handleClose = () => {
    if (confirmModal.loading) {
      return;
    }

    confirmModal.onClose?.();
    closeConfirmModal();
    resetConfirmModal();
  };

  const handleConfirm = async () => {
    if (confirmModal.onConfirm) {
      setConfirmModalLoading(true);
      try {
        await confirmModal.onConfirm();
        closeConfirmModal();
        resetConfirmModal();
      } catch (error) {
        setConfirmModalLoading(false);
      }
    }
  };

  return (
    <ConfirmModal
      isOpen={confirmModal.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={confirmModal.title}
      message={confirmModal.message}
      content={confirmModal.content}
      confirmText={confirmModal.confirmText}
      cancelText={confirmModal.cancelText}
      destructive={confirmModal.destructive}
      loading={confirmModal.loading}
      confirmDisabled={confirmModal.confirmDisabled}
    />
  );
}
