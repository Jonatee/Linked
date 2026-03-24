"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SettingsSkeleton } from "@/components/loading/screen-skeletons";
import SquareAvatar from "@/components/branding/square-avatar";
import { uploadMediaFile } from "@/lib/media-upload";
import useAuthStore from "@/stores/auth-store";

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <div className="font-medium text-white">{label}</div>
        <div className="text-xs text-muted">{hint}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-accent" : "bg-[#353534]"}`}
      >
        <span
          className={`absolute top-[2px] h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-[2px]"}`}
        />
      </button>
    </div>
  );
}

export default function SettingsForm() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const currentUser = useAuthStore((state) => state.currentUser);
  const accessToken = useAuthStore((state) => state.accessToken);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [mediaState, setMediaState] = useState({
    avatarMediaId: "",
    avatarUrl: "",
    bannerMediaId: "",
    bannerUrl: ""
  });
  const [uploadingTarget, setUploadingTarget] = useState("");
  const profileForm = useForm({
    defaultValues: {
      displayName: "",
      bio: "",
      website: "",
      location: "",
      occupation: "",
      avatarMediaId: "",
      bannerMediaId: ""
    }
  });
  const settingsForm = useForm({
    defaultValues: {
      allowCommentsFrom: "everyone",
      feedContentPreference: "latest",
      emailNotificationsEnabled: true,
      pushNotificationsEnabled: true,
      themePreference: "system",
      language: "en"
    }
  });

  const meQuery = useQuery({
    queryKey: ["me-settings"],
    queryFn: async () => {
      const response = await api.get("/auth/me");
      return response.data.data;
    }
  });

  const profileMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.patch("/users/profile", values);
      return response.data.data;
    },
    onSuccess: (nextProfile) => {
      setSession({
        accessToken,
        user: currentUser
          ? {
              ...currentUser,
              profile: {
                ...currentUser.profile,
                ...nextProfile,
                avatarMedia: mediaState.avatarUrl
                  ? {
                      ...(currentUser.profile?.avatarMedia || {}),
                      secureUrl: mediaState.avatarUrl
                    }
                  : currentUser.profile?.avatarMedia || null,
                bannerMedia: mediaState.bannerUrl
                  ? {
                      ...(currentUser.profile?.bannerMedia || {}),
                      secureUrl: mediaState.bannerUrl
                    }
                  : currentUser.profile?.bannerMedia || null
              }
            }
          : null
      });
      queryClient.invalidateQueries({ queryKey: ["me-settings"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  });

  const settingsMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.patch("/users/settings", values);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me-settings"] });
    }
  });

  const profile = meQuery.data?.profile;
  const settings = meQuery.data?.settings;
  const user = meQuery.data?.user;

  useEffect(() => {
    if (!profile) {
      return;
    }

    profileForm.reset({
      displayName: profile.displayName || "",
      bio: profile.bio || "",
      website: profile.website || "",
      location: profile.location || "",
      occupation: profile.occupation || "",
      avatarMediaId: profile.avatarMediaId || "",
      bannerMediaId: profile.bannerMediaId || ""
    });
    setMediaState({
      avatarMediaId: profile.avatarMediaId || "",
      avatarUrl: profile.avatarMedia?.secureUrl || "",
      bannerMediaId: profile.bannerMediaId || "",
      bannerUrl: profile.bannerMedia?.secureUrl || ""
    });
  }, [profile, profileForm]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    settingsForm.reset({
      allowCommentsFrom: settings.allowCommentsFrom || "everyone",
      feedContentPreference: settings.feedContentPreference || "latest",
      emailNotificationsEnabled: settings.emailNotificationsEnabled ?? true,
      pushNotificationsEnabled: settings.pushNotificationsEnabled ?? true,
      themePreference: settings.themePreference || "system",
      language: settings.language || "en"
    });
  }, [settings, settingsForm]);

  if (meQuery.isLoading) {
    return <SettingsSkeleton />;
  }

  if (meQuery.error || !meQuery.data) {
    return <div className="panel p-6 text-sm text-accent">Failed to load settings.</div>;
  }

  async function handleUpload(event, target) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingTarget(target);
      const media = await uploadMediaFile(file, target === "avatar" ? "profile_avatar" : "profile_banner");
      setMediaState((current) => ({
        ...current,
        avatarMediaId: target === "avatar" ? media.id : current.avatarMediaId,
        avatarUrl: target === "avatar" ? media.secureUrl : current.avatarUrl,
        bannerMediaId: target === "banner" ? media.id : current.bannerMediaId,
        bannerUrl: target === "banner" ? media.secureUrl : current.bannerUrl
      }));
      profileForm.setValue(target === "avatar" ? "avatarMediaId" : "bannerMediaId", media.id, {
        shouldDirty: true
      });
    } finally {
      setUploadingTarget("");
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-10">
      <section className="panel p-6">
        <div className="mb-8">
          <div className="editorial-title text-3xl font-black text-white">Settings</div>
          <p className="mt-2 text-sm text-muted">Manage your public profile and platform preferences for LInked.</p>
        </div>

        <div className="grid gap-8">
          <div>
            <div className="editorial-title mb-4 text-xs font-bold text-muted">Profile</div>
            <form
              className="grid gap-4"
              onSubmit={profileForm.handleSubmit((values) => profileMutation.mutate(values))}
            >
              <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#121111]">
                <div className="relative h-40 bg-[linear-gradient(135deg,#0b0b0b_0%,#7a1111_55%,#161616_100%)]">
                  {mediaState.bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaState.bannerUrl} alt="Profile banner" className="h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute right-4 top-4">
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleUpload(event, "banner")}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={uploadingTarget === "banner"}
                    >
                      {uploadingTarget === "banner" ? "Uploading banner..." : "Upload banner"}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between">
                  <div className="-mt-16 flex items-end gap-4">
                    <SquareAvatar
                      size="lg"
                      initials={(profile?.displayName || user?.username || "LI").slice(0, 2).toUpperCase()}
                      src={mediaState.avatarUrl}
                      alt={`${profile?.displayName || user?.username || "LInked"} avatar`}
                    />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleUpload(event, "avatar")}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingTarget === "avatar"}
                    >
                      {uploadingTarget === "avatar" ? "Uploading avatar..." : "Upload avatar"}
                    </Button>
                  </div>
                  <div className="text-xs text-muted">
                    Square avatar recommended. Banner accepts wide images.
                  </div>
                </div>
              </div>
              <Input {...profileForm.register("displayName")} placeholder="Display name" />
              <Textarea {...profileForm.register("bio")} placeholder="Bio" />
              <Input {...profileForm.register("website")} placeholder="Website" />
              <Input {...profileForm.register("location")} placeholder="Location" />
              <Input {...profileForm.register("occupation")} placeholder="Occupation" />
              <div className="flex items-center justify-end">
                <Button type="submit">{profileMutation.isPending ? "Saving..." : "Save profile"}</Button>
              </div>
            </form>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="editorial-title mb-4 text-xs font-bold text-muted">Account</div>
            <div className="grid gap-4">
              <Input value={user?.username || ""} disabled />
              <Input value={user?.email || ""} disabled />
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="editorial-title mb-4 text-xs font-bold text-muted">Preferences</div>
            <form
              className="grid gap-6"
              onSubmit={settingsForm.handleSubmit((values) => settingsMutation.mutate(values))}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input {...settingsForm.register("allowCommentsFrom")} placeholder="Allow comments from" />
                <Input {...settingsForm.register("feedContentPreference")} placeholder="Feed preference" />
                <Input {...settingsForm.register("themePreference")} placeholder="Theme preference" />
                <Input {...settingsForm.register("language")} placeholder="Language" />
              </div>
              <div className="grid gap-5">
                <Toggle
                  label="Email alerts"
                  hint="Digest and important account updates"
                  checked={settingsForm.watch("emailNotificationsEnabled")}
                  onChange={(value) => settingsForm.setValue("emailNotificationsEnabled", value)}
                />
                <Toggle
                  label="Push notifications"
                  hint="Immediate product activity updates"
                  checked={settingsForm.watch("pushNotificationsEnabled")}
                  onChange={(value) => settingsForm.setValue("pushNotificationsEnabled", value)}
                />
              </div>
              <div className="flex items-center justify-end">
                <Button type="submit">{settingsMutation.isPending ? "Saving..." : "Save preferences"}</Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
