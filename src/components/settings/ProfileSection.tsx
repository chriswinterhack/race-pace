"use client";

import { useRef } from "react";
import { User, Loader2, Check, Camera, MapPin } from "lucide-react";
import { Input, Label, Button } from "@/components/ui";
import { toast } from "sonner";
import Image from "next/image";
import { compressImage } from "@/lib/utils/image-compression";
import { US_STATES } from "@/lib/constants/us-states";
import type { UserProfile, SettingsFormState } from "@/types/settings";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ProfileSectionProps {
  user: UserProfile | null;
  formState: SettingsFormState;
  updateFormField: <K extends keyof SettingsFormState>(
    field: K,
    value: SettingsFormState[K]
  ) => void;
  saving: string | null;
  uploadingAvatar: boolean;
  setUploadingAvatar: (value: boolean) => void;
  saveProfile: () => Promise<void>;
  supabase: SupabaseClient;
}

export function ProfileSection({
  user,
  formState,
  updateFormField,
  saving,
  uploadingAvatar,
  setUploadingAvatar,
  saveProfile,
  supabase,
}: ProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
      });
      const compressedFile = new File([compressed.blob], "avatar.jpg", {
        type: "image/jpeg",
      });
      const fileName = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, compressedFile, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: urlWithCacheBust })
        .eq("id", user.id);

      if (updateError) throw updateError;

      updateFormField("avatarUrl", urlWithCacheBust);
      toast.success("Profile picture updated");
    } catch (error) {
      console.error("Upload error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to upload: ${message}`);
    }

    setUploadingAvatar(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">Profile</h2>
        <p className="text-sm text-brand-navy-500">
          Your public identity on FinalClimb
        </p>
      </div>

      <div className="bg-white rounded-xl border border-brand-navy-200 divide-y divide-brand-navy-100">
        {/* Avatar */}
        <div className="p-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand-navy-100 to-brand-navy-200 overflow-hidden flex items-center justify-center ring-4 ring-white shadow-lg">
                {formState.avatarUrl ? (
                  <Image
                    src={formState.avatarUrl}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-brand-navy-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-brand-sky-500 text-white hover:bg-brand-sky-600 transition-colors disabled:opacity-50 shadow-lg"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1 pt-2">
              <h3 className="font-medium text-brand-navy-900">Profile Photo</h3>
              <p className="text-sm text-brand-navy-500 mt-1">
                This will be displayed on your public profile and in
                discussions.
              </p>
              <p className="text-xs text-brand-navy-400 mt-2">
                JPG, PNG or GIF. Max 10MB. Auto-compressed to 400x400.
              </p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="p-6">
          <Label className="text-brand-navy-700 mb-3 block">Name</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div>
              <Label
                htmlFor="firstName"
                className="text-sm text-brand-navy-600 mb-1 block"
              >
                First Name
              </Label>
              <Input
                id="firstName"
                placeholder="First name"
                value={formState.firstName}
                onChange={(e) => updateFormField("firstName", e.target.value)}
              />
            </div>
            <div>
              <Label
                htmlFor="lastName"
                className="text-sm text-brand-navy-600 mb-1 block"
              >
                Last Name
              </Label>
              <Input
                id="lastName"
                placeholder="Last name"
                value={formState.lastName}
                onChange={(e) => updateFormField("lastName", e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-brand-navy-400 mt-2">
            This is how you&apos;ll appear to other users
          </p>
        </div>

        {/* Location */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-brand-navy-500" />
            <Label className="text-brand-navy-700">Location</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div>
              <Label
                htmlFor="city"
                className="text-sm text-brand-navy-600 mb-1 block"
              >
                City
              </Label>
              <Input
                id="city"
                placeholder="e.g., Denver"
                value={formState.city}
                onChange={(e) => updateFormField("city", e.target.value)}
              />
            </div>
            <div>
              <Label
                htmlFor="state"
                className="text-sm text-brand-navy-600 mb-1 block"
              >
                State
              </Label>
              <select
                id="state"
                value={formState.state}
                onChange={(e) => updateFormField("state", e.target.value)}
                className="w-full h-10 rounded-md border border-brand-navy-200 bg-white px-3 text-sm text-brand-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-sky-500 focus:border-transparent"
              >
                <option value="">Select state</option>
                {US_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-brand-navy-400 mt-2">
            Used to connect you with nearby athletes and training partners
          </p>
        </div>

        {/* Email */}
        <div className="p-6">
          <Label htmlFor="email" className="text-brand-navy-700">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ""}
            disabled
            className="mt-2 max-w-md bg-brand-navy-50"
          />
          <p className="text-xs text-brand-navy-400 mt-2">
            Your email address cannot be changed
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveProfile} disabled={saving === "profile"}>
          {saving === "profile" ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
