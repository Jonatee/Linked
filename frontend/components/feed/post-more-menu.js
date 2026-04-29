"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Flag, MoreHorizontal, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuthStore from "@/stores/auth-store";
import useUiStore from "@/stores/ui-store";

const REPORT_REASONS = [
  { value: "spam", label: "Spam or scam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "violence", label: "Violence" },
  { value: "nudity", label: "Nudity" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" }
];

function MenuItem({ icon: Icon, label, destructive = false, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
        destructive ? "text-accent hover:bg-accent/10" : "text-[#ece7e2] hover:bg-white/5"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}

export default function PostMoreMenu({ post }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.currentUser);
  const openConfirmModal = useUiStore((state) => state.openConfirmModal);
  const updateConfirmModal = useUiStore((state) => state.updateConfirmModal);
  const confirmModal = useUiStore((state) => state.confirmModal);
  const [open, setOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [reasonCode, setReasonCode] = useState("");
  const [description, setDescription] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    queryClient.invalidateQueries({ queryKey: ["explore"] });
    queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    queryClient.invalidateQueries({ queryKey: ["post", post.id] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["search"] });
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${post.id}`);
    },
    onSuccess: () => {
      invalidateAll();
      setOpen(false);
    }
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/reports", {
        targetType: "post",
        targetId: post.id,
        reasonCode,
        description: description.trim()
      });

      return response.data.data;
    },
    onSuccess: (data) => {
      setReported(true);
      setOpen(false);
      setReportModalOpen(false);
      if (!data?.alreadyReported) {
        setDescription("");
        setReasonCode("");
      }
    }
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      if (post.viewerState.blockedByViewer) {
        await api.delete(`/users/${post.author.id}/block`);
      } else {
        await api.post(`/users/${post.author.id}/block`);
      }
    },
    onSuccess: () => {
      invalidateAll();
      setOpen(false);
    }
  });

  const busy = deleteMutation.isPending || reportMutation.isPending || blockMutation.isPending;

  function handleDelete() {
    openConfirmModal({
      title: "Delete Post",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: () => deleteMutation.mutateAsync()
    });
  }

  function resetReportState() {
    setReportModalOpen(false);
    if (!reportMutation.isPending) {
      setReasonCode("");
      setDescription("");
    }
  }

  function buildReportContent() {
    return (
      <div className="grid gap-2">
        {REPORT_REASONS.map((reason) => (
          <button
            key={reason.value}
            type="button"
            onClick={() => setReasonCode(reason.value)}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
              reasonCode === reason.value
                ? "border-accent bg-accent/10 text-white"
                : "border-white/10 bg-[#111] text-[#ece7e2] hover:bg-white/5"
            }`}
          >
            {reason.label}
          </button>
        ))}
        <Input
          placeholder="Optional details"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
    );
  }

  useEffect(() => {
    if (!reportModalOpen) {
      return;
    }

    updateConfirmModal({
      title: "Report Post",
      message: "Choose a reason for reporting this post.",
      content: buildReportContent(),
      confirmText: reported ? "Already reported" : "Submit report",
      cancelText: "Cancel",
      destructive: false,
      confirmDisabled: !reasonCode || reported,
      onClose: resetReportState,
      onConfirm: () => reportMutation.mutateAsync()
    });
  }, [reportModalOpen, reasonCode, description, reported, reportMutation.isPending]);

  function handleReport() {
    if (!currentUser) {
      router.push(getLoginRedirectPath(pathname || `/posts/${post.id}`));
      return;
    }

    setReasonCode("");
    setDescription("");
    setReportModalOpen(true);
    openConfirmModal({
      title: "Report Post",
      message: "Choose a reason for reporting this post.",
      content: buildReportContent(),
      confirmText: "Submit report",
      cancelText: "Cancel",
      confirmDisabled: true,
      onClose: resetReportState,
      onConfirm: () => reportMutation.mutateAsync()
    });
  }

  function handleBlock() {
    if (!currentUser) {
      router.push(getLoginRedirectPath(pathname || `/posts/${post.id}`));
      return;
    }

    const isBlocking = !post.viewerState.blockedByViewer;
    const action = isBlocking ? "block" : "unblock";

    openConfirmModal({
      title: isBlocking ? "Block User" : "Unblock User",
      message: `Are you sure you want to ${action} @${post.author.username}?`,
      confirmText: isBlocking ? "Block" : "Unblock",
      cancelText: "Cancel",
      destructive: isBlocking,
      onConfirm: () => blockMutation.mutateAsync()
    });
  }

  useEffect(() => {
    if (!confirmModal.isOpen && reportModalOpen) {
      resetReportState();
    }
  }, [confirmModal.isOpen, reportModalOpen]);

  return (
    <div ref={containerRef} className="relative z-30">
      {open ? (
        <div
          className="fixed inset-0 z-20 bg-black/25 backdrop-blur-[6px]"
          aria-hidden="true"
          onClick={() => {
            setOpen(false);
          }}
        />
      ) : null}

      <Button
        type="button"
        variant="ghost"
        className="relative z-30 h-9 w-9 rounded-full px-0"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open post actions"
      >
        <MoreHorizontal size={18} />
      </Button>

      {open ? (
        <div className="absolute right-0 top-11 z-30 min-w-[220px] overflow-hidden rounded-[18px] border border-white/10 bg-[#141313] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          {post.viewerState.isOwner ? (
            <MenuItem
              icon={Trash2}
              label={deleteMutation.isPending ? "Deleting..." : "Delete post"}
              destructive
              disabled={busy}
              onClick={handleDelete}
            />
          ) : (
            <>
              <MenuItem
                icon={Flag}
                label={reported ? "Already reported" : reportMutation.isPending ? "Reporting..." : "Report post"}
                disabled={busy || reported}
                onClick={handleReport}
              />
              <MenuItem
                icon={Ban}
                label={
                  blockMutation.isPending
                    ? post.viewerState.blockedByViewer
                      ? "Unblocking..."
                      : "Blocking..."
                    : post.viewerState.blockedByViewer
                      ? `Unblock @${post.author.username}`
                      : `Block @${post.author.username}`
                }
                destructive={!post.viewerState.blockedByViewer}
                disabled={busy || !post.author.id}
                onClick={handleBlock}
              />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
