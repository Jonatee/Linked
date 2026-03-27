"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import SquareAvatar from "@/components/branding/square-avatar";
import api from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function ReplyComposer({ commentId, postId, onClose }) {
  const queryClient = useQueryClient();
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

  return (
    <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="mt-4 rounded-[16px] border border-white/10 bg-[#111] p-4">
      <Textarea placeholder="Write a reply" {...form.register("content", { required: true })} />
      <div className="mt-3 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Replying..." : "Reply"}
        </Button>
      </div>
    </form>
  );
}

function CommentNode({ comment, childrenMap, depth = 0 }) {
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
    <div className={depth > 0 ? "ml-6 border-l border-white/10 pl-4" : ""}>
      <div className="panel p-4">
        <div className="flex gap-3">
          <Link href={comment.author.username ? `/profile/${comment.author.username}` : "#"}>
            <SquareAvatar
              initials={comment.author.initials}
              src={comment.author.avatarUrl}
              alt={comment.author.name}
              size="sm"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={comment.author.username ? `/profile/${comment.author.username}` : "#"}
                className="editorial-title text-sm font-bold text-white hover:text-accent"
              >
                {comment.author.name}
              </Link>
              {comment.author.username ? (
                <span className="truncate text-xs text-muted">@{comment.author.username}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#ece7e2]">{comment.content}</p>
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setReplyOpen((value) => !value)}
                className="text-xs text-muted transition hover:text-white"
              >
                Reply
              </button>
              <button
                type="button"
                onClick={handleLike}
                className={`inline-flex items-center gap-2 text-xs transition ${liked ? "text-accent" : "text-muted hover:text-white"}`}
              >
                <Heart size={14} fill={liked ? "currentColor" : "none"} />
                <span>Like</span>
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
        <div className="mt-4 space-y-4">
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
    <div className="space-y-4">
      {rootComments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} childrenMap={childrenMap} />
      ))}
    </div>
  );
}
