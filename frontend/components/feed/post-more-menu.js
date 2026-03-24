"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Flag, MoreHorizontal, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

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
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
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
      await api.post("/reports", {
        targetType: "post",
        targetId: post.id,
        reasonCode: "user_report",
        description: `Reported post by @${post.author.username}`
      });
    },
    onSuccess: () => {
      setOpen(false);
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
    if (!window.confirm("Delete this post?")) {
      return;
    }

    deleteMutation.mutate();
  }

  function handleReport() {
    reportMutation.mutate();
  }

  function handleBlock() {
    const label = post.viewerState.blockedByViewer ? "unblock" : "block";
    if (!window.confirm(`Do you want to ${label} @${post.author.username}?`)) {
      return;
    }

    blockMutation.mutate();
  }

  return (
    <div ref={containerRef} className="relative z-30">
      {open ? (
        <div
          className="fixed inset-0 z-20 bg-black/25 backdrop-blur-[6px]"
          aria-hidden="true"
          onClick={() => setOpen(false)}
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
                label={reportMutation.isPending ? "Reporting..." : "Report post"}
                disabled={busy}
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
