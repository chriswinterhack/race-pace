"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { User, Zap, Droplets, Settings2, Shield, Loader2, Check, Camera, Upload, Lock, Mountain, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { calculateAllPowerTargets } from "@/lib/calculations/power";

interface AthleteProfile {
  id: string;
  user_id: string;
  weight_kg: number | null;
  ftp_watts: number | null;
  altitude_adjustment_factor: number | null;
  if_safe: number | null;
  if_tempo: number | null;
  if_pushing: number | null;
  power_settings_locked: boolean;
  power_settings_locked_by: string | null;
  nutrition_cho_per_hour: number | null;
  hydration_ml_per_hour: number | null;
  sodium_mg_per_hour: number | null;
  preferred_units: "metric" | "imperial";
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  profile_public: boolean;
  avatar_url: string | null;
}

// Conversion helpers
const kgToLbs = (kg: number) => kg * 2.20462;
const lbsToKg = (lbs: number) => lbs / 2.20462;

// Image compression helper
async function compressImage(file: File, maxSize = 400, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [ftp, setFtp] = useState("");
  const [weight, setWeight] = useState("");
  const [altitudeAdjustment, setAltitudeAdjustment] = useState("");
  const [ifSafe, setIfSafe] = useState("67");
  const [ifTempo, setIfTempo] = useState("70");
  const [ifPushing, setIfPushing] = useState("73");
  const [carbsPerHour, setCarbsPerHour] = useState("");
  const [fluidPerHour, setFluidPerHour] = useState("");
  const [sodiumPerHour, setSodiumPerHour] = useState("");
  const [preferredUnits, setPreferredUnits] = useState<"metric" | "imperial">("imperial");
  const [publicProfile, setPublicProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Check if power settings are locked
  const isLocked = profile?.power_settings_locked ?? false;

  useEffect(() => {
    fetchUserAndProfile();
  }, []);

  async function fetchUserAndProfile() {
    setLoading(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id, email, name, profile_public, avatar_url")
      .eq("id", authUser.id)
      .single();

    if (userData) {
      setUser(userData);
      setName(userData.name || "");
      setPublicProfile(userData.profile_public || false);
      setAvatarUrl(userData.avatar_url);
    }

    const { data: profileData } = await supabase
      .from("athlete_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFtp(profileData.ftp_watts?.toString() || "");
      setWeight(profileData.weight_kg?.toString() || "");
      setAltitudeAdjustment(((profileData.altitude_adjustment_factor || 0.20) * 100).toString());
      setIfSafe(((profileData.if_safe || 0.67) * 100).toString());
      setIfTempo(((profileData.if_tempo || 0.70) * 100).toString());
      setIfPushing(((profileData.if_pushing || 0.73) * 100).toString());
      setCarbsPerHour(profileData.nutrition_cho_per_hour?.toString() || "90");
      setFluidPerHour(profileData.hydration_ml_per_hour?.toString() || "750");
      setSodiumPerHour(profileData.sodium_mg_per_hour?.toString() || "750");
      setPreferredUnits(profileData.preferred_units || "imperial");
    }

    setLoading(false);
  }

  // Calculate power targets for display
  const powerTargets = useMemo(() => {
    const ftpValue = parseFloat(ftp) || 0;
    if (ftpValue === 0) return null;

    return calculateAllPowerTargets(
      ftpValue,
      (parseFloat(altitudeAdjustment) || 20) / 100,
      {
        safe: (parseFloat(ifSafe) || 67) / 100,
        tempo: (parseFloat(ifTempo) || 70) / 100,
        pushing: (parseFloat(ifPushing) || 73) / 100,
      }
    );
  }, [ftp, altitudeAdjustment, ifSafe, ifTempo, ifPushing]);

  const getDisplayWeight = () => {
    if (!weight) return "";
    const kg = parseFloat(weight);
    if (isNaN(kg)) return "";
    return preferredUnits === "imperial" ? kgToLbs(kg).toFixed(1) : kg.toFixed(1);
  };

  const handleWeightChange = (value: string) => {
    if (!value) {
      setWeight("");
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    const kgValue = preferredUnits === "imperial" ? lbsToKg(numValue) : numValue;
    setWeight(kgValue.toString());
  };

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
      const compressedBlob = await compressImage(file, 400, 0.8);
      const compressedFile = new File([compressedBlob], "avatar.jpg", { type: "image/jpeg" });
      const fileName = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, compressedFile, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: urlWithCacheBust })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBust);
      toast.success("Profile picture updated");
    } catch (error) {
      console.error("Upload error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to upload: ${message}`);
    }

    setUploadingAvatar(false);
  }

  async function saveProfile() {
    if (!user || saving) return;
    setSaving("profile");

    const { error } = await supabase
      .from("users")
      .update({ name })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile saved");
    }
    setSaving(null);
  }

  async function savePowerSettings() {
    if (!user || saving || isLocked) return;
    setSaving("power");

    const updates = {
      user_id: user.id,
      ftp_watts: ftp ? parseInt(ftp) : null,
      weight_kg: weight ? parseFloat(weight) : null,
      altitude_adjustment_factor: altitudeAdjustment ? parseFloat(altitudeAdjustment) / 100 : 0.20,
      if_safe: ifSafe ? parseFloat(ifSafe) / 100 : 0.67,
      if_tempo: ifTempo ? parseFloat(ifTempo) / 100 : 0.70,
      if_pushing: ifPushing ? parseFloat(ifPushing) / 100 : 0.73,
    };

    const { error } = await supabase
      .from("athlete_profiles")
      .upsert(updates, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to save power settings");
      console.error(error);
    } else {
      toast.success("Power settings saved");
    }
    setSaving(null);
  }

  async function saveNutrition() {
    if (!user || saving) return;
    setSaving("nutrition");

    const updates = {
      user_id: user.id,
      nutrition_cho_per_hour: carbsPerHour ? parseInt(carbsPerHour) : 90,
      hydration_ml_per_hour: fluidPerHour ? parseInt(fluidPerHour) : 750,
      sodium_mg_per_hour: sodiumPerHour ? parseInt(sodiumPerHour) : 750,
    };

    const { error } = await supabase
      .from("athlete_profiles")
      .upsert(updates, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to save nutrition targets");
      console.error(error);
    } else {
      toast.success("Default nutrition targets saved");
    }
    setSaving(null);
  }

  async function savePreferences() {
    if (!user || saving) return;
    setSaving("preferences");

    const { error: profileError } = await supabase
      .from("athlete_profiles")
      .upsert({ user_id: user.id, preferred_units: preferredUnits }, { onConflict: "user_id" });

    const { error: userError } = await supabase
      .from("users")
      .update({ profile_public: publicProfile })
      .eq("id", user.id);

    if (profileError || userError) {
      toast.error("Failed to save preferences");
      console.error(profileError || userError);
    } else {
      toast.success("Preferences saved");
    }
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900 sm:text-3xl">Settings</h1>
        <p className="mt-2 text-brand-navy-600">Manage your profile and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-sky-50">
                <User className="h-5 w-5 text-brand-sky-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-brand-navy-100 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Profile" width={80} height={80} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-brand-navy-400" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-brand-sky-500 text-white hover:bg-brand-sky-600 transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-brand-navy-900">Profile Picture</p>
                <p className="text-xs text-brand-navy-500 mt-0.5">JPG, PNG or GIF. Auto-compressed to 400x400.</p>
                <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled />
              <p className="text-xs text-brand-navy-500">Email cannot be changed</p>
            </div>
            <Button className="w-full sm:w-auto" onClick={saveProfile} disabled={saving === "profile"}>
              {saving === "profile" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Power Zones Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Power Zones</CardTitle>
                  <CardDescription>Intensity factors and calculated targets</CardDescription>
                </div>
              </div>
              {isLocked && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-full text-amber-700 text-sm font-medium">
                  <Lock className="h-3.5 w-3.5" />
                  Locked by Coach
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base Metrics */}
            <div>
              <h4 className="text-sm font-medium text-brand-navy-700 mb-3">Base Metrics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ftp">FTP (watts)</Label>
                  <Input id="ftp" type="number" placeholder="250" className="font-mono" value={ftp} onChange={(e) => setFtp(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight ({preferredUnits === "imperial" ? "lbs" : "kg"})</Label>
                  <Input id="weight" type="number" step="0.1" placeholder={preferredUnits === "imperial" ? "154" : "70"} className="font-mono" value={getDisplayWeight()} onChange={(e) => handleWeightChange(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-2">
                  <Label htmlFor="altitude">Altitude Adjustment (%)</Label>
                  <Input id="altitude" type="number" step="1" min="0" max="50" placeholder="20" className="font-mono" value={altitudeAdjustment} onChange={(e) => setAltitudeAdjustment(e.target.value)} disabled={isLocked} />
                  <p className="text-xs text-brand-navy-500">Applied automatically for races above 4,000 ft</p>
                </div>
              </div>
            </div>

            {/* Intensity Factors */}
            <div>
              <h4 className="text-sm font-medium text-brand-navy-700 mb-3">Intensity Factors (IF) - % of FTP</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="if-safe" className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    IF Safe
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input id="if-safe" type="number" min="50" max="80" className="font-mono" value={ifSafe} onChange={(e) => setIfSafe(e.target.value)} disabled={isLocked} />
                    <span className="text-sm text-brand-navy-500">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="if-tempo" className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    IF Tempo
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input id="if-tempo" type="number" min="55" max="85" className="font-mono" value={ifTempo} onChange={(e) => setIfTempo(e.target.value)} disabled={isLocked} />
                    <span className="text-sm text-brand-navy-500">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="if-pushing" className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    IF Pushing
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input id="if-pushing" type="number" min="60" max="90" className="font-mono" value={ifPushing} onChange={(e) => setIfPushing(e.target.value)} disabled={isLocked} />
                    <span className="text-sm text-brand-navy-500">%</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-brand-navy-500">
                IF = Intensity Factor. NP (Normalized Power) = FTP × IF. Your IF determines your target NP for each zone.
              </p>
            </div>

            {/* Calculated Power Tables */}
            {powerTargets && (
              <div className="space-y-4 pt-4 border-t border-brand-navy-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-brand-navy-900">Calculated Power Targets</h4>
                  {weight && (
                    <div className="text-right">
                      <span className="text-xs text-brand-navy-500">Power-to-Weight:</span>
                      <span className="ml-2 font-mono font-bold text-brand-navy-900">
                        {(powerTargets.baseFtp / parseFloat(weight)).toFixed(2)} W/kg
                      </span>
                      <span className="ml-1 text-xs text-brand-navy-400">
                        (adjusted: {(powerTargets.adjustedFtp / parseFloat(weight)).toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Target NP Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-navy-100">
                        <th className="text-left py-2 pr-4 font-medium text-brand-navy-600">Target NP</th>
                        <th className="text-center py-2 px-4 font-medium text-emerald-700">
                          <div>Safe</div>
                          <div className="text-xs font-normal">IF {ifSafe}%</div>
                        </th>
                        <th className="text-center py-2 px-4 font-medium text-amber-700">
                          <div>Tempo</div>
                          <div className="text-xs font-normal">IF {ifTempo}%</div>
                        </th>
                        <th className="text-center py-2 px-4 font-medium text-red-700">
                          <div>Pushing</div>
                          <div className="text-xs font-normal">IF {ifPushing}%</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-brand-navy-50">
                        <td className="py-2 pr-4 text-brand-navy-700">Sea Level NP</td>
                        <td className="py-2 px-4 text-center font-mono">{powerTargets.seaLevelNP.safe}w</td>
                        <td className="py-2 px-4 text-center font-mono">{powerTargets.seaLevelNP.tempo}w</td>
                        <td className="py-2 px-4 text-center font-mono">{powerTargets.seaLevelNP.pushing}w</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 text-brand-navy-700">
                          AA NP <span className="text-brand-navy-400">(-{powerTargets.altitudeAdjustmentPercent}%)</span>
                        </td>
                        <td className="py-2 px-4 text-center font-mono font-bold text-emerald-700">{powerTargets.adjustedNP.safe}w</td>
                        <td className="py-2 px-4 text-center font-mono font-bold text-amber-700">{powerTargets.adjustedNP.tempo}w</td>
                        <td className="py-2 px-4 text-center font-mono font-bold text-red-700">{powerTargets.adjustedNP.pushing}w</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Terrain Pacing Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-navy-100">
                        <th className="text-left py-2 pr-4 font-medium text-brand-navy-600">Terrain NP</th>
                        <th className="text-center py-2 px-4 font-medium text-emerald-700">Safe NP</th>
                        <th className="text-center py-2 px-4 font-medium text-amber-700">Tempo NP</th>
                        <th className="text-center py-2 px-4 font-medium text-red-700">Pushing NP</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-brand-navy-50">
                        <td className="py-2 pr-4 text-brand-navy-700 flex items-center gap-2">
                          <Mountain className="h-4 w-4 text-brand-navy-400" />
                          Climbing <span className="text-brand-navy-400">(+20% NP)</span>
                        </td>
                        <td className="py-2 px-4 text-center font-mono bg-emerald-50 rounded">{powerTargets.climbingPower.safe}w</td>
                        <td className="py-2 px-4 text-center font-mono bg-amber-50 rounded">{powerTargets.climbingPower.tempo}w</td>
                        <td className="py-2 px-4 text-center font-mono bg-red-50 rounded">{powerTargets.climbingPower.pushing}w</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 text-brand-navy-700 flex items-center gap-2">
                          <Minus className="h-4 w-4 text-brand-navy-400" />
                          Flats <span className="text-brand-navy-400">(-10% NP)</span>
                        </td>
                        <td className="py-2 px-4 text-center font-mono bg-emerald-50 rounded">{powerTargets.flatPower.safe}w</td>
                        <td className="py-2 px-4 text-center font-mono bg-amber-50 rounded">{powerTargets.flatPower.tempo}w</td>
                        <td className="py-2 px-4 text-center font-mono bg-red-50 rounded">{powerTargets.flatPower.pushing}w</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Button className="w-full sm:w-auto" onClick={savePowerSettings} disabled={saving === "power" || isLocked}>
              {saving === "power" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Power Settings
            </Button>

            <p className="text-xs text-brand-navy-500">
              These are your default targets. Per-race adjustments are available on individual race plan pages.
            </p>
          </CardContent>
        </Card>

        {/* Default Nutrition Targets */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-sky-50">
                <Droplets className="h-5 w-5 text-brand-sky-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Default Nutrition Targets</CardTitle>
                <CardDescription>Hourly fueling goals (can be customized per event)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g/hr)</Label>
                <Input id="carbs" type="number" placeholder="90" className="font-mono" value={carbsPerHour} onChange={(e) => setCarbsPerHour(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fluid">Fluid (ml/hr)</Label>
                <Input id="fluid" type="number" placeholder="750" className="font-mono" value={fluidPerHour} onChange={(e) => setFluidPerHour(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sodium">Sodium (mg/hr)</Label>
                <Input id="sodium" type="number" placeholder="750" className="font-mono" value={sodiumPerHour} onChange={(e) => setSodiumPerHour(e.target.value)} />
              </div>
            </div>
            <Button className="w-full sm:w-auto" onClick={saveNutrition} disabled={saving === "nutrition"}>
              {saving === "nutrition" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Targets
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Settings2 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Preferences</CardTitle>
                <CardDescription>App settings and visibility</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-brand-navy-900">Units</p>
                <p className="text-sm text-brand-navy-600">Display distances and weights</p>
              </div>
              <select
                className="px-3 py-2 border border-brand-navy-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-sky-400"
                value={preferredUnits}
                onChange={(e) => setPreferredUnits(e.target.value as "metric" | "imperial")}
              >
                <option value="imperial">Imperial (mi, lb)</option>
                <option value="metric">Metric (km, kg)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-brand-navy-900">Public Profile</p>
                <p className="text-sm text-brand-navy-600">Allow others to see your profile and gear</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={publicProfile}
                onClick={() => setPublicProfile(!publicProfile)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-sky-400 focus:ring-offset-2",
                  publicProfile ? "bg-brand-sky-500" : "bg-brand-navy-200"
                )}
              >
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", publicProfile ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>
            <Button className="w-full sm:w-auto" onClick={savePreferences} disabled={saving === "preferences"}>
              {saving === "preferences" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-brand-navy-900">Delete Account</p>
              <p className="text-sm text-brand-navy-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
