"use client";

import useUiStore from "@/stores/ui-store";
import PostComposer from "@/components/feed/post-composer";

export default function ComposerModal() {
  const composerOpen = useUiStore((state) => state.composerOpen);
  const closeComposer = useUiStore((state) => state.closeComposer);

  if (!composerOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close composer"
        className="absolute inset-0 cursor-default"
        onClick={closeComposer}
      />
      <div className="relative z-10 w-full max-w-2xl">
        <PostComposer variant="modal" />
      </div>
    </div>
  );
}

