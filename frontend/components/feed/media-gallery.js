export default function MediaGallery({ media = [] }) {
  if (!media.length) {
    return null;
  }

  const isSingle = media.length === 1;

  return (
    <div className={isSingle ? "mt-4" : "mt-4 grid grid-cols-2 gap-3"}>
      {media.map((item) => (
        <div
          key={item.id}
          className="overflow-hidden rounded-[18px] border border-white/10 bg-[#0e0e0e]"
        >
          {item.type === "video" ? (
            <video
              src={item.url}
              controls
              preload="metadata"
              className={isSingle ? "h-auto w-full bg-black object-cover" : "h-56 w-full bg-black object-cover"}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.alt || "Post media"}
              className={isSingle ? "h-auto w-full object-cover" : "h-56 w-full object-cover"}
            />
          )}
        </div>
      ))}
    </div>
  );
}
