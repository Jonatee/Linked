"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Bell, BellOff, MessageSquareText, UserCheck, UserPlus, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import SquareAvatar from "@/components/branding/square-avatar";
import VerifiedBadge from "@/components/branding/verified-badge";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import useAuthStore from "@/stores/auth-store";

export default function ProfileHeader({ profile }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.currentUser);
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

  const postNotificationsMutation = useMutation({
    mutationFn: async () => {
      const suffix = profile.viewerState.postNotificationsEnabled ? "off" : "on";
      await api.put(`/users/${profile.userId}/follow/post-notifications/${suffix}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    }
  });

  const openChatMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/messages/conversations", {
        recipientId: profile.userId
      });

      return response.data.data;
    },
    onSuccess: (data) => {
      const conversationId = data?.conversation?.id;
      if (conversationId) {
        router.push(`/messages/${conversationId}`);
      } else {
        router.push("/messages");
      }
    }
  });

  const canMessage = Boolean(profile.viewerState.canMessage ?? (profile.viewerState.following || profile.viewerState.followsViewer));
  const busy =
    followMutation.isPending || blockMutation.isPending || postNotificationsMutation.isPending || openChatMutation.isPending;

  function requireLogin() {
    router.push(getLoginRedirectPath(pathname || `/profile/${profile.username}`));
  }

  function actionButtonClassName() {
    return "h-11 w-11 rounded-xl px-0";
  }

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
            className={profile.avatarUrl ? "cursor-pointer" : ""}
          />
          {profile.viewerState.isSelf ? (
            <Button variant="secondary" onClick={() => router.push("/profile/edit")}>
              Edit profile
            </Button>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-6">
              {canMessage ? (
                <Button
                  variant="secondary"
                  className={actionButtonClassName()}
                  title="Message"
                  aria-label="Message"
                  onClick={() => {
                    if (!currentUser) {
                      requireLogin();
                      return;
                    }

                    openChatMutation.mutate();
                  }}
                  loading={openChatMutation.isPending}
                  disabled={busy || profile.viewerState.blockedByViewer || profile.viewerState.hasBlockedViewer}
                >
                  <MessageSquareText size={16} />
                </Button>
              ) : null}

              {!profile.viewerState.hasBlockedViewer ? (
                <Button
                  variant={profile.viewerState.following ? "secondary" : "primary"}
                  className={actionButtonClassName()}
                  title={profile.viewerState.following ? "Unfollow" : "Follow"}
                  aria-label={profile.viewerState.following ? "Unfollow" : "Follow"}
                  onClick={() => {
                    if (!currentUser) {
                      requireLogin();
                      return;
                    }

                    followMutation.mutate();
                  }}
                  loading={followMutation.isPending}
                  disabled={busy || profile.viewerState.blockedByViewer}
                >
                  {profile.viewerState.following ? <UserCheck size={16} /> : <UserPlus size={16} />}
                </Button>
              ) : (
                <Button variant="secondary" className={actionButtonClassName()} disabled title="Blocked you" aria-label="Blocked you">
                  <Ban size={16} />
                </Button>
              )}

              {profile.viewerState.following ? (
                <Button
                  variant="secondary"
                  className={actionButtonClassName()}
                  title={profile.viewerState.postNotificationsEnabled ? "Turn off post alerts" : "Turn on post alerts"}
                  aria-label={profile.viewerState.postNotificationsEnabled ? "Turn off post alerts" : "Turn on post alerts"}
                  onClick={() => {
                    if (!currentUser) {
                      requireLogin();
                      return;
                    }

                    postNotificationsMutation.mutate();
                  }}
                  loading={postNotificationsMutation.isPending}
                  disabled={busy || profile.viewerState.blockedByViewer}
                >
                  {profile.viewerState.postNotificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                </Button>
              ) : null}

              <Button
                variant="secondary"
                className={actionButtonClassName()}
                title={profile.viewerState.blockedByViewer ? "Unblock" : "Block"}
                aria-label={profile.viewerState.blockedByViewer ? "Unblock" : "Block"}
                onClick={() => {
                  if (!currentUser) {
                    requireLogin();
                    return;
                  }

                  blockMutation.mutate();
                }}
                loading={blockMutation.isPending}
                disabled={busy}
              >
                <Ban size={16} />
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="editorial-title text-3xl font-black text-white">{profile.displayName}</h1>
            {profile.isVerified ? <VerifiedBadge /> : null}
          </div>
          <p className="mt-1 text-sm text-muted">@{profile.username}</p>
          <div className="mt-4 flex items-center gap-6 text-sm text-[#ece7e2]">
            <Link href={`/profile/${profile.username}/following`} className="transition hover:text-white">
              <span className="font-bold text-white">{profile.followingCount}</span> Following
            </Link>
            <Link href={`/profile/${profile.username}/followers`} className="transition hover:text-white">
              <span className="font-bold text-white">{profile.followerCount}</span> Followers
            </Link>
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
