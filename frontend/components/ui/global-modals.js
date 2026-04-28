"use client";

import { ConfirmModal } from "@/components/ui/modal";
import useUiStore from "@/stores/ui-store";

export default function GlobalModals() {
  const { confirmModal, closeConfirmModal, setConfirmModalLoading } = useUiStore();

  const handleConfirm = async () => {
    if (confirmModal.onConfirm) {
      setConfirmModalLoading(true);
      try {
        await confirmModal.onConfirm();
        closeConfirmModal();
      } catch (error) {
        setConfirmModalLoading(false);
        // Error handling can be added here if needed
      }
    }
  };

  return (
    <ConfirmModal
      isOpen={confirmModal.isOpen}
      onClose={closeConfirmModal}
      onConfirm={handleConfirm}
      title={confirmModal.title}
      message={confirmModal.message}
      confirmText={confirmModal.confirmText}
      cancelText={confirmModal.cancelText}
      destructive={confirmModal.destructive}
      loading={confirmModal.loading}
    />
  );
}