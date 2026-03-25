"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function MediaGallery({ media = [] }) {
  if (!media.length) {
    return null;
  }

  const isSingle = media.length === 1;
  const isMulti = media.length > 1;
  const [activeItem, setActiveItem] = useState(null);

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
            <button
              type="button"
              onClick={() => setActiveItem(item)}
              className={`relative block w-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%),linear-gradient(180deg,#171515_0%,#0d0d0d_100%)] text-left ${
                isSingle ? "max-h-[340px]" : "aspect-[16/10] p-3"
              }`}
            >
              <div className={isSingle ? "" : "h-full w-full"}>
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    controls
                    preload="metadata"
                    className={`w-full rounded-[14px] bg-black ${
                      isSingle ? "max-h-[340px] object-cover" : "h-full object-contain"
                    }`}
                    onClick={(event) => event.stopPropagation()}
                  />
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
            </button>
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
                src={activeItem.url}
                controls
                autoPlay
                className="max-h-[calc(90vh-24px)] max-w-[calc(92vw-24px)] rounded-[18px] bg-black"
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
