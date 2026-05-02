"use client";

import { useEffect, useMemo, useState } from "react";
import { Crop, MoveHorizontal, MoveVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const ASPECT_OPTIONS = [
  { value: "original", label: "Original" },
  { value: "square", label: "1:1" },
  { value: "portrait", label: "4:5" },
  { value: "landscape", label: "16:9" }
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getAspectValue(mode, naturalSize) {
  switch (mode) {
    case "square":
      return 1;
    case "portrait":
      return 4 / 5;
    case "landscape":
      return 16 / 9;
    default:
      return naturalSize?.width && naturalSize?.height ? naturalSize.width / naturalSize.height : 1;
  }
}

function getViewportSize(aspectValue) {
  let width = aspectValue >= 1 ? 320 : Math.round(360 * aspectValue);
  let height = aspectValue >= 1 ? Math.round(320 / aspectValue) : 360;

  if (width > 320) {
    width = 320;
    height = Math.round(width / aspectValue);
  }

  if (height > 360) {
    height = 360;
    width = Math.round(height * aspectValue);
  }

  return {
    width: Math.max(180, width),
    height: Math.max(180, height)
  };
}

async function createCroppedFile({ imageUrl, fileName, mimeType, naturalSize, viewport, zoom, panX, panY }) {
  const image = await new Promise((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error("Failed to load the selected image"));
    nextImage.src = imageUrl;
  });

  const baseScale = Math.max(viewport.width / naturalSize.width, viewport.height / naturalSize.height);
  const renderedWidth = naturalSize.width * baseScale * zoom;
  const renderedHeight = naturalSize.height * baseScale * zoom;
  const maxOffsetX = Math.max(0, (renderedWidth - viewport.width) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - viewport.height) / 2);
  const actualOffsetX = panX * maxOffsetX;
  const actualOffsetY = panY * maxOffsetY;
  const left = (viewport.width - renderedWidth) / 2 + actualOffsetX;
  const top = (viewport.height - renderedHeight) / 2 + actualOffsetY;

  const srcX = clamp(((0 - left) / renderedWidth) * naturalSize.width, 0, naturalSize.width);
  const srcY = clamp(((0 - top) / renderedHeight) * naturalSize.height, 0, naturalSize.height);
  const srcWidth = clamp((viewport.width / renderedWidth) * naturalSize.width, 1, naturalSize.width - srcX);
  const srcHeight = clamp((viewport.height / renderedHeight) * naturalSize.height, 1, naturalSize.height - srcY);
  const scaleFactor = Math.min(1, 1600 / srcWidth, 1600 / srcHeight);
  const outputWidth = Math.max(1, Math.round(srcWidth * scaleFactor));
  const outputHeight = Math.max(1, Math.round(srcHeight * scaleFactor));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not prepare the cropped image");
  }

  context.drawImage(image, srcX, srcY, srcWidth, srcHeight, 0, 0, outputWidth, outputHeight);

  const finalMimeType = mimeType === "image/png" || mimeType === "image/webp" ? mimeType : "image/jpeg";
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (!nextBlob) {
        reject(new Error("Failed to export the cropped image"));
        return;
      }

      resolve(nextBlob);
    }, finalMimeType, finalMimeType === "image/jpeg" ? 0.92 : undefined);
  });

  return new File([blob], fileName, {
    type: finalMimeType,
    lastModified: Date.now()
  });
}

export default function MediaCropDialog({ open, imageUrl, fileName, mimeType, onCancel, onUseOriginal, onConfirm }) {
  const [naturalSize, setNaturalSize] = useState(null);
  const [aspectMode, setAspectMode] = useState("original");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open || !imageUrl) {
      return undefined;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) {
        return;
      }

      setNaturalSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height
      });
    };
    image.onerror = () => {
      if (!cancelled) {
        setErrorMessage("We couldn't load that image for cropping.");
      }
    };
    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setAspectMode("original");
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setSubmitting(false);
    setErrorMessage("");
  }, [imageUrl, open]);

  const aspectValue = useMemo(() => getAspectValue(aspectMode, naturalSize), [aspectMode, naturalSize]);
  const viewport = useMemo(() => getViewportSize(aspectValue), [aspectValue]);
  const baseScale = naturalSize
    ? Math.max(viewport.width / naturalSize.width, viewport.height / naturalSize.height)
    : 1;
  const renderedWidth = naturalSize ? naturalSize.width * baseScale * zoom : viewport.width;
  const renderedHeight = naturalSize ? naturalSize.height * baseScale * zoom : viewport.height;
  const maxOffsetX = Math.max(0, (renderedWidth - viewport.width) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - viewport.height) / 2);
  const actualOffsetX = panX * maxOffsetX;
  const actualOffsetY = panY * maxOffsetY;

  if (!open) {
    return null;
  }

  async function handleApplyCrop() {
    if (!imageUrl || !naturalSize) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      const croppedFile = await createCroppedFile({
        imageUrl,
        fileName,
        mimeType,
        naturalSize,
        viewport,
        zoom,
        panX,
        panY
      });
      onConfirm(croppedFile);
    } catch (error) {
      setErrorMessage(error?.message || "Unable to crop this image right now.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/12 bg-[#141111] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div>
            <div className="editorial-title flex items-center gap-2 text-lg font-black text-white">
              <Crop size={18} className="text-accent" />
              Crop image
            </div>
            <p className="mt-1 text-sm text-muted">Adjust the framing before this image is uploaded.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ASPECT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setAspectMode(option.value);
                  setPanX(0);
                  setPanY(0);
                  setZoom(1);
                }}
                className={
                  aspectMode === option.value
                    ? "rounded-full border border-accent bg-accent/15 px-3 py-1.5 text-xs font-semibold text-white transition"
                    : "rounded-full border border-white/10 bg-[#1f1a1a] px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-white/20 hover:text-white"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-[24px] border border-white/10 bg-[#0b0b0b] p-4">
            <div className="flex min-h-[380px] items-center justify-center rounded-[22px] border border-white/8 bg-[#111] p-4">
              <div
                className="relative overflow-hidden rounded-[20px] border border-white/12 bg-black"
                style={{ width: viewport.width, height: viewport.height }}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={fileName || "Crop preview"}
                    className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                    style={{
                      width: renderedWidth,
                      height: renderedHeight,
                      transform: `translate(calc(-50% + ${actualOffsetX}px), calc(-50% + ${actualOffsetY}px))`
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-white/10 bg-[#181313] p-4">
            <div className="rounded-[18px] border border-white/8 bg-[#120f0f] p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Output</div>
              <div className="mt-2 text-sm text-[#ece7e2]">
                {naturalSize ? `${naturalSize.width} x ${naturalSize.height}px source` : "Loading image"}
              </div>
              <div className="mt-1 text-xs text-muted">
                {`${Math.round(viewport.width)} x ${Math.round(viewport.height)} frame at ${aspectValue.toFixed(2)} ratio`}
              </div>
            </div>

            <label className="block text-sm text-[#ece7e2]">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
                <Search size={14} />
                Zoom
              </span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-[#ff4d4f]"
              />
            </label>

            <label className="block text-sm text-[#ece7e2]">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
                <MoveHorizontal size={14} />
                Horizontal crop
              </span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={panX}
                onChange={(event) => setPanX(Number(event.target.value))}
                className="w-full accent-[#ff4d4f]"
                disabled={!maxOffsetX}
              />
            </label>

            <label className="block text-sm text-[#ece7e2]">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
                <MoveVertical size={14} />
                Vertical crop
              </span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={panY}
                onChange={(event) => setPanY(Number(event.target.value))}
                className="w-full accent-[#ff4d4f]"
                disabled={!maxOffsetY}
              />
            </label>

            {errorMessage ? <div className="rounded-2xl border border-[#8f2525] bg-[#2a1111] px-3 py-2 text-sm text-[#ffb4b4]">{errorMessage}</div> : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full px-4 text-xs uppercase tracking-[0.14em] text-muted">
                Skip file
              </Button>
              <Button type="button" variant="secondary" onClick={onUseOriginal} className="rounded-full px-4 text-xs uppercase tracking-[0.14em]">
                Use original
              </Button>
              <Button type="button" onClick={handleApplyCrop} loading={submitting} className="rounded-full px-5 text-xs uppercase tracking-[0.14em]">
                Apply crop
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
