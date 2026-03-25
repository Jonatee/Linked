"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, X } from "lucide-react";
import { useRouter } from "next/navigation";
import SquareAvatar from "@/components/branding/square-avatar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function ProfileHeader({ profile }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  useEffect(() => {
    if (!showAvatarPreview) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setShowAvatarPreview(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showAvatarPreview]);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (profile.viewerState.following) {
        await api.delete(`/users/${profile.userId}/follow`);
      } else {
        await api.post(`/users/${profile.userId}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    }
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      if (profile.viewerState.blockedByViewer) {
        await api.delete(`/users/${profile.userId}/block`);
      } else {
        await api.post(`/users/${profile.userId}/block`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    }
  });

  const busy = followMutation.isPending || blockMutation.isPending;

  return (
    <section className="panel overflow-hidden">
      <div className="relative subtle-grid h-44 bg-[linear-gradient(135deg,#0b0b0b_0%,#7a1111_55%,#161616_100%)]">
        {profile.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.bannerUrl} alt={`${profile.displayName} banner`} className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-black/25" />
      </div>
      <div className="p-6">
        <div className="-mt-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SquareAvatar
            size="lg"
            initials={profile.initials}
            src={profile.avatarUrl}
            alt={profile.displayName}
            onClick={profile.avatarUrl ? () => setShowAvatarPreview(true) : undefined}
            className={profile.avatarUrl ? "transition hover:opacity-95" : ""}
          />
          {profile.viewerState.isSelf ? (
            <Button variant="secondary" onClick={() => router.push("/profile/edit")}>
              Edit profile
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {!profile.viewerState.hasBlockedViewer ? (
                <Button
                  variant={profile.viewerState.following ? "secondary" : "primary"}
                  onClick={() => followMutation.mutate()}
                  loading={followMutation.isPending}
                  disabled={busy || profile.viewerState.blockedByViewer}
                >
                  {profile.viewerState.following ? "Following" : "Follow"}
                </Button>
              ) : (
                <Button variant="secondary" disabled>
                  Blocked you
                </Button>
              )}

              <Button variant="secondary" onClick={() => blockMutation.mutate()} loading={blockMutation.isPending} disabled={busy}>
                <Ban size={16} className="mr-2" />
                {profile.viewerState.blockedByViewer ? "Unblock" : "Block"}
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4">
          <h1 className="editorial-title text-3xl font-black text-white">{profile.displayName}</h1>
          <p className="mt-1 text-sm text-muted">@{profile.username}</p>
          <div className="mt-4 flex items-center gap-6 text-sm text-[#ece7e2]">
            <div>
              <span className="font-bold text-white">{profile.followingCount}</span> Following
            </div>
            <div>
              <span className="font-bold text-white">{profile.followerCount}</span> Followers
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#ece7e2]">{profile.bio}</p>
          {profile.viewerState.blockedByViewer ? (
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-accent">You blocked this account. Posts and engagement are disabled.</p>
          ) : null}
          {profile.viewerState.hasBlockedViewer ? (
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-accent">This account has blocked you.</p>
          ) : null}
        </div>
      </div>
      {showAvatarPreview && profile.avatarUrl ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close profile photo preview backdrop"
            onClick={() => setShowAvatarPreview(false)}
          />
          <button
            type="button"
            onClick={() => setShowAvatarPreview(false)}
            className="absolute right-4 top-4 z-[121] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-white transition hover:bg-[#1f1f1f]"
            aria-label="Close profile photo preview"
          >
            <X size={18} />
          </button>
          <div className="relative z-[121] max-h-[90vh] max-w-[92vw] overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0b0b] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarUrl}
              alt={`${profile.displayName} profile photo`}
              className="max-h-[calc(90vh-24px)] max-w-[calc(92vw-24px)] rounded-[18px] object-contain"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
