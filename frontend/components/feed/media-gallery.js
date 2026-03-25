"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

function formatDuration(seconds = 0) {
  const totalSeconds = Math.max(Math.round(Number(seconds) || 0), 0);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function MediaGallery({ media = [] }) {
  const isSingle = media.length === 1;
  const isMulti = media.length > 1;
  const [activeItem, setActiveItem] = useState(null);
  const [posterFailures, setPosterFailures] = useState({});

  useEffect(() => {
    if (!activeItem) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setActiveItem(null);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [activeItem]);

  function hasPoster(item) {
    return Boolean(item.posterUrl) && !posterFailures[item.id];
  }

  if (!media.length) {
    return null;
  }

  return (
    <>
      <div
        className={
          isSingle
            ? "mt-3"
            : "mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        {media.map((item, index) => (
          <div
            key={item.id}
            className={`overflow-hidden rounded-[20px] border border-white/10 bg-[#0e0e0e] ${
              isSingle ? "" : "w-[88%] max-w-[420px] shrink-0 snap-start"
            }`}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveItem(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveItem(item);
                }
              }}
              className={`relative block w-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%),linear-gradient(180deg,#171515_0%,#0d0d0d_100%)] text-left ${
                isSingle ? "max-h-[340px]" : "aspect-[16/10] p-3"
              }`}
            >
              <div className={isSingle ? "" : "h-full w-full"}>
                {item.type === "video" ? (
                  <div className="relative">
                    {hasPoster(item) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.posterUrl}
                        alt={item.alt || "Video preview"}
                        className={`w-full rounded-[14px] bg-black ${
                          isSingle ? "max-h-[340px] object-cover" : "h-full object-contain"
                        }`}
                        onError={() =>
                          setPosterFailures((current) => ({
                            ...current,
                            [item.id]: true
                          }))
                        }
                      />
                    ) : (
                      <div
                        className={`w-full rounded-[14px] bg-black ${
                          isSingle ? "h-[220px]" : "h-full min-h-[180px]"
                        }`}
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                        <Play size={18} fill="currentColor" />
                      </div>
                    </div>
                    <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white">
                      <span>{formatDuration(item.duration)}</span>
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.alt || "Post media"}
                    className={`w-full rounded-[14px] ${
                      isSingle ? "max-h-[340px] object-cover" : "h-full object-contain"
                    }`}
                  />
                )}
              </div>
              {isMulti ? (
                <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
                  {index + 1}/{media.length}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {activeItem ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close media preview backdrop"
            onClick={() => setActiveItem(null)}
          />
          <button
            type="button"
            onClick={() => setActiveItem(null)}
            className="absolute right-4 top-4 z-[121] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-white transition hover:bg-[#1f1f1f]"
            aria-label="Close media preview"
          >
            <X size={18} />
          </button>
          <div className="relative z-[121] max-h-[90vh] max-w-[92vw] overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0b0b] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            {activeItem.type === "video" ? (
              <video
                src={activeItem.playbackUrl || activeItem.url}
                controls
                autoPlay
                playsInline
                poster={activeItem.posterUrl || undefined}
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                className="max-h-[calc(90vh-24px)] max-w-[92vw] rounded-[18px] bg-black"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeItem.url}
                alt={activeItem.alt || "Expanded post media"}
                className="max-h-[calc(90vh-24px)] max-w-[calc(92vw-24px)] rounded-[18px] object-contain"
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
