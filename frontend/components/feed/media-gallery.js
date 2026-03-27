"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!activeItem) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setActiveItem(null);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeItem]);

  function hasPoster(item) {
    return Boolean(item.posterUrl) && !posterFailures[item.id];
  }

  function handlePreviewOpen(event, item) {
    event.preventDefault();
    event.stopPropagation();
    setActiveItem(item);
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
              isSingle ? "" : "w-[92%] max-w-[420px] shrink-0 snap-start sm:w-[88%]"
            }`}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={(event) => handlePreviewOpen(event, item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  setActiveItem(item);
                }
              }}
              className={`relative block w-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%),linear-gradient(180deg,#171515_0%,#0d0d0d_100%)] text-left ${
                isSingle ? "flex h-[360px] items-center justify-center p-2 sm:h-[420px] sm:p-3" : "aspect-[16/10] p-2.5 sm:p-3"
              }`}
            >
              <div className={isSingle ? "flex h-full w-full items-center justify-center" : "h-full w-full"}>
                {item.type === "video" ? (
                  <div className="relative">
                    {hasPoster(item) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.posterUrl}
                        alt={item.alt || "Video preview"}
                        className={`w-full rounded-[14px] bg-black ${
                          isSingle ? "h-full max-h-[344px] w-full object-contain sm:max-h-[396px]" : "h-full object-contain"
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
                          isSingle ? "h-full max-h-[344px] sm:max-h-[396px]" : "h-full min-h-[160px] sm:min-h-[180px]"
                        }`}
                      />
                    )}
                    {isSingle ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={hasPoster(item) ? item.posterUrl : item.url}
                          alt=""
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-black/35" />
                      </>
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] sm:h-14 sm:w-14">
                        <Play size={16} fill="currentColor" className="sm:h-[18px] sm:w-[18px]" />
                      </div>
                    </div>
                    <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-2 rounded-full border border-white/10 bg-black/65 px-2 py-1 text-[10px] font-medium text-white sm:bottom-3 sm:left-3 sm:px-2.5 sm:text-[11px]">
                      <span>{formatDuration(item.duration)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {isSingle ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt=""
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-black/35" />
                      </>
                    ) : null}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.alt || "Post media"}
                      className={`relative z-10 w-full rounded-[14px] ${
                        isSingle ? "h-full max-h-[344px] w-full object-contain sm:max-h-[396px]" : "h-full object-contain"
                      }`}
                    />
                  </div>
                )}
              </div>
              {isMulti ? (
                <div className="pointer-events-none absolute right-2 top-2 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] font-medium text-white sm:right-3 sm:top-3 sm:px-2.5 sm:text-[11px]">
                  {index + 1}/{media.length}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {activeItem && portalReady
        ? createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black/88 p-3 backdrop-blur-md sm:p-5"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActiveItem(null);
            }
          }}
        >
          {activeItem.type !== "video" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeItem.url}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-3xl"
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.22)_45%,rgba(0,0,0,0.78)_100%)]" />
            </>
          ) : (
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0.28)_45%,rgba(0,0,0,0.85)_100%)] backdrop-blur-md" />
          )}
          <button
            type="button"
            onClick={() => setActiveItem(null)}
            className="absolute right-4 top-4 z-[123] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#141414]/92 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:bg-[#1f1f1f] sm:right-5 sm:top-5"
            aria-label="Close media preview"
          >
            <X size={18} />
          </button>
          <div
            className="relative z-[122] max-h-[88vh] w-full max-w-[94vw] overflow-hidden rounded-[20px] border border-white/10 bg-[#0b0b0b]/92 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-h-[88vh] sm:max-w-[90vw] sm:rounded-[24px] sm:p-3"
            onClick={(event) => event.stopPropagation()}
          >
            {activeItem.type === "video" ? (
              <video
                src={activeItem.playbackUrl || activeItem.url}
                controls
                autoPlay
                playsInline
                poster={activeItem.posterUrl || undefined}
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                className="max-h-[calc(88vh-16px)] w-full rounded-[16px] bg-black sm:max-h-[calc(88vh-24px)] sm:max-w-[90vw] sm:rounded-[18px]"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeItem.url}
                alt={activeItem.alt || "Expanded post media"}
                className="max-h-[calc(88vh-16px)] w-full rounded-[16px] object-contain sm:max-h-[calc(88vh-24px)] sm:max-w-[calc(90vw-24px)] sm:rounded-[18px]"
              />
            )}
          </div>
        </div>
        ,
        document.body
      )
        : null}
    </>
  );
}
