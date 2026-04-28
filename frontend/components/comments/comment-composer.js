"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import { Textarea } from "@/components/ui/textarea";
import SquareAvatar from "@/components/branding/square-avatar";
import useAuthStore from "@/stores/auth-store";

export default function CommentComposer({ postId }) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.currentUser);
  const form = useForm({
    defaultValues: {
      content: ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post(`/posts/${postId}/comments`, values);
      return response.data.data;
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    }
  });

  if (!currentUser) {
    return (
      <div className="panel p-4">
        <div className="editorial-title mb-2 text-xs font-bold text-muted">Reply</div>
        <p className="text-sm text-muted">Log in to comment on this post.</p>
        <div className="mt-4">
          <Link href={getLoginRedirectPath(`/posts/${postId}`)} className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white">
            Log in to reply
          </Link>
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
      className="panel p-4"
    >
      <div className="flex items-start gap-3">
        <SquareAvatar
          initials={(currentUser?.profile?.displayName || currentUser?.username || "LI").slice(0, 2).toUpperCase()}
          src={currentUser?.profile?.avatarMedia?.secureUrl || ""}
          alt={`${currentUser?.username || "LInked"} avatar`}
          size="sm"
        />
        <div className="flex-1">
          <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[#242425] shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
            <div className="px-4 pb-2 pt-3">
              <Textarea
                placeholder="Post your reply"
                className="min-h-[64px] rounded-none bg-transparent px-0 py-0 text-[15px] leading-6 text-[#ece7e2] placeholder:text-[#6d6764] focus:ring-0"
                {...form.register("content", { required: true })}
              />
            </div>
            <div className="flex justify-end border-t border-white/5 px-3 py-3">
              <button
                type="submit"
                disabled={mutation.isPending || !form.watch("content")?.trim()}
                className="inline-flex min-w-[104px] items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(224,36,36,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? "Replying..." : "Reply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
