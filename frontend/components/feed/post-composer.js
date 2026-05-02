"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock3, Crop, Image as ImageIcon, LoaderCircle, TriangleAlert, Video } from "lucide-react";
import api from "@/lib/api";
import SquareAvatar from "@/components/branding/square-avatar";
import MediaCropDialog from "@/components/feed/media-crop-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import useUiStore from "@/stores/ui-store";
import useAuthStore from "@/stores/auth-store";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import { uploadMediaFile } from "@/lib/media-upload";
import { cn } from "@/lib/utils";

function createLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDuration(value = 0) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.round(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function revokeObjectUrl(url) {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

async function readImageMetadata(file) {
  const previewUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Failed to read image dimensions"));
      nextImage.src = previewUrl;
    });

    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height
    };
  } finally {
    revokeObjectUrl(previewUrl);
  }
}

async function readVideoMetadata(file) {
  const previewUrl = URL.createObjectURL(file);

  try {
    const video = await new Promise((resolve, reject) => {
      const nextVideo = document.createElement("video");
      nextVideo.preload = "metadata";
      nextVideo.onloadedmetadata = () => resolve(nextVideo);
      nextVideo.onerror = () => reject(new Error("Failed to read video duration"));
      nextVideo.src = previewUrl;
    });

    return {
      duration: Number(video.duration) || 0,
      width: video.videoWidth || null,
      height: video.videoHeight || null
    };
  } finally {
    revokeObjectUrl(previewUrl);
  }
}

export default function PostComposer({ variant = "inline" }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const closeComposer = useUiStore((state) => state.closeComposer);
  const currentUser = useAuthStore((state) => state.currentUser);
  const fileInputRef = useRef(null);
  const mediaItemsRef = useRef([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [selectionBusy, setSelectionBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [cropSession, setCropSession] = useState(null);
  const form = useForm({
    defaultValues: {
      content: ""
    }
  });

  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  useEffect(() => {
    return () => {
      mediaItemsRef.current.forEach((item) => revokeObjectUrl(item.localPreviewUrl));
      if (cropSession?.previewUrl) {
        revokeObjectUrl(cropSession.previewUrl);
      }
    };
  }, [cropSession]);

  const hasPendingMedia = mediaItems.some((item) => item.status === "uploading");
  const hasBrokenMedia = mediaItems.some((item) => item.status === "error");
  const readyMediaItems = mediaItems.filter((item) => item.status === "ready" && item.id);
  const canSubmit = !selectionBusy && !hasPendingMedia && !hasBrokenMedia;
  const watchedContent = form.watch("content") || "";

  const mutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post("/posts", {
        type: readyMediaItems.length ? "media" : "text",
        visibility: "public",
        content: values.content,
        mediaIds: readyMediaItems.map((item) => item.id)
      });

      return response.data.data;
    },
    onSuccess: () => {
      mediaItemsRef.current.forEach((item) => revokeObjectUrl(item.localPreviewUrl));
      form.reset();
      setMediaItems([]);
      setUploadError("");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      closeComposer();
    }
  });

  function updateMediaItem(localId, updater) {
    setMediaItems((current) =>
      current.map((item) => {
        if (item.localId !== localId) {
          return item;
        }

        return typeof updater === "function" ? updater(item) : { ...item, ...updater };
      })
    );
  }

  function replaceMediaItem(localId, nextItem) {
    setMediaItems((current) => current.map((item) => (item.localId === localId ? nextItem : item)));
  }

  async function requestImageCrop(file) {
    return new Promise((resolve) => {
      const previewUrl = URL.createObjectURL(file);
      setCropSession({
        file,
        previewUrl,
        resolve
      });
    });
  }

  function closeCropSession(resolution) {
    setCropSession((current) => {
      if (!current) {
        return null;
      }

      current.resolve(resolution);
      revokeObjectUrl(current.previewUrl);
      return null;
    });
  }

  async function uploadPreparedFile(file, options = {}) {
    const type = file.type.startsWith("video/") ? "video" : "image";
    const localId = options.localId || createLocalId();
    const previousMediaId = options.previousMediaId || null;
    const metadata = type === "video" ? await readVideoMetadata(file) : await readImageMetadata(file);
    const localPreviewUrl = URL.createObjectURL(file);
    const nextItem = {
      localId,
      id: null,
      type,
      altText: file.name,
      secureUrl: "",
      localPreviewUrl,
      width: metadata.width || null,
      height: metadata.height || null,
      duration: metadata.duration || 0,
      sourceFile: file,
      progress: 1,
      status: "uploading",
      errorMessage: ""
    };

    if (options.localId) {
      const existing = mediaItemsRef.current.find((item) => item.localId === options.localId);
      if (existing?.localPreviewUrl && existing.localPreviewUrl !== localPreviewUrl) {
        revokeObjectUrl(existing.localPreviewUrl);
      }

      if (existing) {
        replaceMediaItem(localId, nextItem);
      } else {
        setMediaItems((current) => [...current, nextItem]);
      }
    } else {
      setMediaItems((current) => [...current, nextItem]);
    }

    try {
      const media = await uploadMediaFile(file, "post", {
        onProgress: (progress) => {
          updateMediaItem(localId, {
            progress,
            status: "uploading"
          });
        }
      });

      if (previousMediaId) {
        api.delete(`/media/${previousMediaId}`).catch(() => {});
      }

      replaceMediaItem(localId, {
        ...nextItem,
        ...media,
        localPreviewUrl: "",
        secureUrl: media.secureUrl,
        width: media.width || nextItem.width,
        height: media.height || nextItem.height,
        duration: media.duration || nextItem.duration,
        progress: 100,
        status: "ready",
        errorMessage: ""
      });
      revokeObjectUrl(localPreviewUrl);
      return true;
    } catch (error) {
      updateMediaItem(localId, {
        progress: 0,
        status: "error",
        errorMessage: error?.message || "Upload failed"
      });
      setUploadError(error?.message || "One of your files could not be uploaded.");
      return false;
    }
  }

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

    setUploadError("");
    setSelectionBusy(true);

    try {
      let plannedItems = [...mediaItemsRef.current];

      for (const originalFile of files) {
        const fileType = originalFile.type.startsWith("video/") ? "video" : "image";
        const activeItems = plannedItems.filter((item) => item.status !== "error");
        const hasVideo = activeItems.some((item) => item.type === "video");
        const imageCount = activeItems.filter((item) => item.type === "image").length;

        if ((fileType === "video" && activeItems.length > 0) || hasVideo) {
          throw new Error("You can upload only one video per post");
        }

        if (fileType === "image" && imageCount >= 4) {
          throw new Error("You can upload up to 4 images per post");
        }

        if (fileType === "image" && hasVideo) {
          throw new Error("Images and video cannot be mixed in one post");
        }

        let preparedFile = originalFile;
        if (fileType === "image") {
          const croppedFile = await requestImageCrop(originalFile);
          if (!croppedFile) {
            continue;
          }
          preparedFile = croppedFile;
        }

        const localId = createLocalId();
        plannedItems = [...plannedItems, { localId, type: fileType, status: "uploading" }];
        await uploadPreparedFile(preparedFile, { localId });
      }
    } catch (error) {
      setUploadError(error?.message || "Unable to process those files.");
    } finally {
      setSelectionBusy(false);
      event.target.value = "";
    }
  }

  async function handleRemoveMedia(localId) {
    const mediaToRemove = mediaItemsRef.current.find((item) => item.localId === localId);
    if (!mediaToRemove || mediaToRemove.status === "uploading") {
      return;
    }

    revokeObjectUrl(mediaToRemove.localPreviewUrl);
    setMediaItems((current) => current.filter((item) => item.localId !== localId));

    if (mediaToRemove.id) {
      try {
        await api.delete(`/media/${mediaToRemove.id}`);
      } catch (error) {
        // Ignore cleanup failure for temp media in the composer.
      }
    }
  }

  async function handleRecropMedia(localId) {
    const mediaItem = mediaItemsRef.current.find((item) => item.localId === localId);
    if (!mediaItem || mediaItem.type !== "image" || mediaItem.status === "uploading" || !mediaItem.sourceFile) {
      return;
    }

    const nextFile = await requestImageCrop(mediaItem.sourceFile);
    if (!nextFile) {
      return;
    }

    setUploadError("");
    await uploadPreparedFile(nextFile, {
      localId,
      previousMediaId: mediaItem.id || null
    });
  }

  const helperText = useMemo(() => {
    if (hasPendingMedia) {
      return "Uploading media... finish uploads before posting.";
    }

    if (hasBrokenMedia) {
      return "Remove failed uploads before posting.";
    }

    return "Up to 4 images or 1 video";
  }, [hasBrokenMedia, hasPendingMedia]);

  return (
    <>
      <form
        onSubmit={form.handleSubmit((values) => {
          if (!currentUser) {
            router.push(getLoginRedirectPath(pathname || "/home"));
            return;
          }

          if (!values.content?.trim() && !readyMediaItems.length) {
            return;
          }

          if (!canSubmit) {
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
            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#222223] shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
              <div className="px-4 pb-3 pt-4">
                <Textarea
                  placeholder="What is happening in your corner of LInked?"
                  className="min-h-[88px] rounded-none bg-transparent px-0 py-0 text-[15px] leading-6 text-[#ece7e2] placeholder:text-[#6b6663] focus:ring-0"
                  {...form.register("content")}
                />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/6 px-4 py-3">
                <div className="flex items-center gap-2 text-[#6f6b68]">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelection}
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md p-1.5 transition hover:bg-white/5 hover:text-[#ff5a5f]" aria-label="Add image or video">
                    <ImageIcon size={16} />
                  </button>
                  <span className="ml-2 text-xs text-muted">{helperText}</span>
                </div>
                <Button
                  type="submit"
                  loading={mutation.isPending}
                  disabled={!canSubmit || (!watchedContent.trim() && !readyMediaItems.length)}
                  className="rounded-full px-6 py-2.5"
                >
                  Post
                </Button>
              </div>
            </div>

            {uploadError ? (
              <div className="mt-4 flex items-start gap-2 rounded-[18px] border border-[#7a2020] bg-[#231010] px-4 py-3 text-sm text-[#ffb4b4]">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            ) : null}

            {mediaItems.length ? (
              <div className={cn("mt-4 grid gap-3", mediaItems.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                {mediaItems.map((item) => {
                  const previewUrl = item.localPreviewUrl || item.secureUrl;
                  const statusLabel = item.status === "ready" ? "Ready" : item.status === "error" ? "Failed" : `${item.progress}%`;

                  return (
                    <div key={item.localId} className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[#0f0f0f]">
                      {item.type === "video" ? (
                        <video src={previewUrl} controls={item.status === "ready"} muted={item.status !== "ready"} className="h-72 w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt={item.altText || "Upload preview"} className="h-56 w-full object-cover" />
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-10">
                        <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.14em] text-white/85">
                          <div className="flex items-center gap-2">
                            {item.type === "video" ? <Clock3 size={12} /> : <Crop size={12} />}
                            <span>
                              {item.type === "video"
                                ? formatDuration(item.duration)
                                : item.width && item.height
                                  ? `${item.width} x ${item.height}`
                                  : "Image"}
                            </span>
                          </div>
                          <span>{statusLabel}</span>
                        </div>
                        {item.status === "uploading" ? (
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${item.progress}%` }} />
                          </div>
                        ) : item.status === "error" ? (
                          <div className="mt-3 text-xs text-[#ffb4b4]">{item.errorMessage || "Upload failed"}</div>
                        ) : null}
                      </div>

                      <div className="absolute left-3 top-3 flex gap-2">
                        {item.type === "image" ? (
                          <button
                            type="button"
                            onClick={() => handleRecropMedia(item.localId)}
                            disabled={item.status === "uploading"}
                            className="rounded-full bg-black/65 px-3 py-1 text-xs text-white transition hover:bg-black/80 disabled:opacity-50"
                          >
                            Crop
                          </button>
                        ) : (
                          <div className="rounded-full bg-black/65 px-3 py-1 text-xs text-white/90">
                            <Video size={12} className="mr-1 inline" />
                            Video
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(item.localId)}
                        disabled={item.status === "uploading"}
                        className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs text-white transition hover:bg-black/80 disabled:opacity-50"
                      >
                        Remove
                      </button>

                      {item.status === "uploading" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                          <div className="rounded-full bg-black/55 p-3 text-white">
                            <LoaderCircle size={18} className="animate-spin" />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </form>

      <MediaCropDialog
        open={Boolean(cropSession)}
        imageUrl={cropSession?.previewUrl || ""}
        fileName={cropSession?.file?.name || "image.jpg"}
        mimeType={cropSession?.file?.type || "image/jpeg"}
        onCancel={() => closeCropSession(null)}
        onUseOriginal={() => closeCropSession(cropSession?.file || null)}
        onConfirm={(nextFile) => closeCropSession(nextFile)}
      />
    </>
  );
}
