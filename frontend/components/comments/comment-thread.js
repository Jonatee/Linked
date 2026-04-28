"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import SquareAvatar from "@/components/branding/square-avatar";
import api from "@/lib/api";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import { Textarea } from "@/components/ui/textarea";
import useAuthStore from "@/stores/auth-store";

function ReplyComposer({ commentId, postId, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.currentUser);
  const form = useForm({
    defaultValues: {
      content: ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post(`/comments/${commentId}/reply`, {
        content: values.content,
        postId
      });
      return response.data.data;
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      onClose();
    }
  });

  if (!currentUser) {
    return (
      <div className="mt-3 rounded-[16px] border border-white/10 bg-[#111] p-4">
        <p className="text-sm text-muted">Log in to reply to this comment.</p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => router.push(getLoginRedirectPath(pathname || `/posts/${postId}`))}
            className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        if (!values.content?.trim()) {
          return;
        }

        mutation.mutate(values);
      })}
      className="mt-3 overflow-hidden rounded-[18px] border border-white/8 bg-[#242425] shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
    >
      <div className="px-4 pb-2 pt-3">
        <Textarea
          placeholder="Post your reply"
          className="min-h-[60px] rounded-none bg-transparent px-0 py-0 text-[15px] leading-6 text-[#ece7e2] placeholder:text-[#6d6764] focus:ring-0"
          {...form.register("content", { required: true })}
        />
      </div>
      <div className="flex items-center justify-between border-t border-white/5 px-3 py-3">
        <button type="button" onClick={onClose} className="text-sm text-[#8e8884] transition hover:text-white">
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending || !form.watch("content")?.trim()}
          className="inline-flex min-w-[104px] items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(224,36,36,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? "Replying..." : "Reply"}
        </button>
      </div>
    </form>
  );
}

function CommentNode({ comment, childrenMap, depth = 0 }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [replyOpen, setReplyOpen] = useState(false);
  const children = childrenMap.get(comment.id) || [];
  const [liked, setLiked] = useState(Boolean(comment.viewerState?.liked));
  const [likeCount, setLikeCount] = useState(comment.stats?.likeCount || 0);
  const queryClient = useQueryClient();
  const likeMutation = useMutation({
    mutationFn: async (nextLiked) => {
      if (nextLiked) {
        await api.post(`/comments/${comment.id}/react`);
      } else {
        await api.delete(`/comments/${comment.id}/react`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", comment.postId] });
    }
  });

  function handleLike() {
    if (!currentUser) {
      router.push(getLoginRedirectPath(pathname || `/posts/${comment.postId}`));
      return;
    }

    if (likeMutation.isPending) {
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((current) => current + (nextLiked ? 1 : -1));

    likeMutation.mutate(nextLiked, {
      onError: () => {
        setLiked(!nextLiked);
        setLikeCount((current) => current + (nextLiked ? -1 : 1));
      }
    });
  }

  return (
    <div className={depth > 0 ? "ml-5 border-l border-white/8 pl-4" : ""}>
      <div className="rounded-[18px] border border-white/8 bg-[#1d1b1b] px-5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
        <div className="flex items-start gap-3">
          <Link href={comment.author.username ? `/profile/${comment.author.username}` : "#"}>
            <SquareAvatar
              initials={comment.author.initials}
              src={comment.author.avatarUrl}
              alt={comment.author.name}
              size="sm"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={comment.author.username ? `/profile/${comment.author.username}` : "#"}
                className="text-base font-semibold leading-none text-[#ece7e2] transition hover:text-accent"
              >
                {comment.author.name}
              </Link>
              <div className="flex min-w-0 items-center gap-2 text-xs text-[#8d8782]">
                {comment.author.username ? <span className="truncate">@{comment.author.username}</span> : null}
                {comment.createdAtLabel ? <span>• {comment.createdAtLabel}</span> : null}
              </div>
            </div>
            <p className="mt-2 text-[15px] leading-7 text-[#ece7e2]">{comment.content}</p>
            <div className="mt-3 flex items-center gap-5 text-[#8d8782]">
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    router.push(getLoginRedirectPath(pathname || `/posts/${comment.postId}`));
                    return;
                  }

                  setReplyOpen((value) => !value);
                }}
                className="inline-flex items-center gap-2 text-sm transition hover:text-white"
              >
                <MessageCircle size={15} />
                <span>{comment.stats?.replyCount ? comment.stats.replyCount : "Reply"}</span>
              </button>
              <button
                type="button"
                onClick={handleLike}
                className={`inline-flex items-center gap-2 text-sm transition ${liked ? "text-accent" : "text-[#8d8782] hover:text-white"}`}
              >
                <Heart size={15} fill={liked ? "currentColor" : "none"} />
                <span>{likeCount}</span>
              </button>
            </div>
            {replyOpen ? (
              <ReplyComposer
                commentId={comment.id}
                postId={comment.postId}
                onClose={() => setReplyOpen(false)}
              />
            ) : null}
          </div>
        </div>
      </div>

      {children.length ? (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <CommentNode key={child.id} comment={child} childrenMap={childrenMap} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CommentThread({ comments = [] }) {
  const { rootComments, childrenMap } = useMemo(() => {
    const map = new Map();
    const roots = [];

    comments.forEach((comment) => {
      const parentId = comment.parentCommentId || null;
      if (parentId) {
        const siblings = map.get(parentId) || [];
        siblings.push(comment);
        map.set(parentId, siblings);
      } else {
        roots.push(comment);
      }
    });

    return {
      rootComments: roots,
      childrenMap: map
    };
  }, [comments]);

  return (
    <div className="space-y-3">
      {rootComments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} childrenMap={childrenMap} />
      ))}
    </div>
  );
}
