"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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

  return (
    <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="panel p-4">
      <div className="flex gap-3">
        <SquareAvatar
          initials={(currentUser?.profile?.displayName || currentUser?.username || "LI").slice(0, 2).toUpperCase()}
          src={currentUser?.profile?.avatarMedia?.secureUrl || ""}
          alt={`${currentUser?.username || "LInked"} avatar`}
          size="sm"
        />
        <div className="flex-1">
          <div className="editorial-title mb-3 text-xs font-bold text-muted">Reply</div>
          <Textarea placeholder="Post your reply" {...form.register("content", { required: true })} />
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Posting..." : "Reply"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
