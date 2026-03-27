"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import SquareAvatar from "@/components/branding/square-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import useUiStore from "@/stores/ui-store";
import useAuthStore from "@/stores/auth-store";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import { uploadMediaFile } from "@/lib/media-upload";
import { cn } from "@/lib/utils";

export default function PostComposer({ variant = "inline" }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const closeComposer = useUiStore((state) => state.closeComposer);
  const currentUser = useAuthStore((state) => state.currentUser);
  const fileInputRef = useRef(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const form = useForm({
    defaultValues: {
      content: ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post("/posts", {
        type: mediaItems.length ? "media" : "text",
        visibility: "public",
        content: values.content,
        mediaIds: mediaItems.map((item) => item.id)
      });

      return response.data.data;
    },
    onSuccess: () => {
      form.reset();
      setMediaItems([]);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      closeComposer();
    }
  });

  async function handleFileSelection(event) {
    if (!currentUser) {
      router.push(getLoginRedirectPath(pathname || "/home"));
      event.target.value = "";
      return;
    }

    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    try {
      setUploading(true);
      let nextItems = [...mediaItems];

      for (const file of files) {
        const fileType = file.type.startsWith("video/") ? "video" : "image";
        const hasVideo = nextItems.some((item) => item.type === "video");
        const imageCount = nextItems.filter((item) => item.type === "image").length;

        if ((fileType === "video" && nextItems.length > 0) || hasVideo) {
          throw new Error("You can upload only one video per post");
        }

        if (fileType === "image" && imageCount >= 4) {
          throw new Error("You can upload up to 4 images per post");
        }

        if (fileType === "image" && hasVideo) {
          throw new Error("Images and video cannot be mixed in one post");
        }

        const media = await uploadMediaFile(file, "post");
        nextItems = [...nextItems, media];
      }

      setMediaItems(nextItems);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleRemoveMedia(mediaId) {
    const mediaToRemove = mediaItems.find((item) => item.id === mediaId);
    setMediaItems((current) => current.filter((item) => item.id !== mediaId));

    if (mediaToRemove) {
      try {
        await api.delete(`/media/${mediaToRemove.id}`);
      } catch (error) {
        // Ignore cleanup failure for temp media in the composer.
      }
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        if (!currentUser) {
          router.push(getLoginRedirectPath(pathname || "/home"));
          return;
        }

        if (!values.content?.trim() && !mediaItems.length) {
          return;
        }

        mutation.mutate(values);
      })}
      className={`panel p-5 ${variant === "modal" ? "border border-white/15 bg-[#171414] p-6" : ""}`}
    >
      <div className="flex gap-4">
        <SquareAvatar
          initials={(currentUser?.profile?.displayName || currentUser?.username || "LI").slice(0, 2).toUpperCase()}
          src={currentUser?.profile?.avatarMedia?.secureUrl || ""}
          alt={`${currentUser?.username || "LInked"} avatar`}
        />
        <div className="flex-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="editorial-title text-xs font-bold text-muted">Compose</div>
            {variant === "modal" ? (
              <button type="button" onClick={closeComposer} className="text-xs text-muted hover:text-white">
                Close
              </button>
            ) : null}
          </div>
          <Textarea
            placeholder="What is happening in your corner of LInked?"
            {...form.register("content")}
          />
          {mediaItems.length ? (
            <div className={cn("mt-4 grid gap-3", mediaItems.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
              {mediaItems.map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[#0f0f0f]">
                  {item.type === "video" ? (
                    <video src={item.secureUrl} controls className="h-72 w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.secureUrl} alt={item.altText || "Upload preview"} className="h-56 w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(item.id)}
                    className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelection}
              />
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                Add media
              </Button>
              <div className="text-xs text-muted">Up to 4 images or 1 video</div>
            </div>
            <Button type="submit" loading={mutation.isPending}>
              Post
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
