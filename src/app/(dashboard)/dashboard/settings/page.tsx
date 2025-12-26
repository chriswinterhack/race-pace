"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  User,
  Zap,
  Droplets,
  Settings2,
  Shield,
  Loader2,
  Check,
  Camera,
  Lock,
  Mountain,
  Minus,
  LogOut,
  Bell,
  Link2,
  ChevronRight,
  CreditCard,
  Crown,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Input, Label, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { calculateAllPowerTargets } from "@/lib/calculations/power";
import { updateUnitsCache } from "@/hooks";

interface AthleteProfile {
  id: string;
  user_id: string;
  weight_kg: number | null;
  gear_weight_kg: number | null;
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

type SettingsSection = "profile" | "athlete" | "nutrition" | "preferences" | "billing" | "notifications" | "integrations" | "account";

const kgToLbs = (kg: number) => kg * 2.20462;
const lbsToKg = (lbs: number) => lbs / 2.20462;

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
          if (blob) resolve(blob);
          else reject(new Error("Failed to compress image"));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

const navItems: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { id: "profile", label: "Profile", icon: User, description: "Name, photo, email" },
  { id: "athlete", label: "Athlete Profile", icon: Zap, description: "FTP, weight, power zones" },
  { id: "nutrition", label: "Nutrition", icon: Droplets, description: "Hourly fueling targets" },
  { id: "preferences", label: "Preferences", icon: Settings2, description: "Units, visibility" },
  { id: "billing", label: "Billing", icon: CreditCard, description: "Subscription & payments" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Email & push settings" },
  { id: "integrations", label: "Integrations", icon: Link2, description: "Connected apps" },
  { id: "account", label: "Account", icon: Shield, description: "Security, logout" },
];

interface SubscriptionData {
  isPremium: boolean;
  status: "active" | "inactive" | "past_due" | "canceled";
  isLifetime: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialSection = (searchParams.get("section") as SettingsSection) || "profile";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [ftp, setFtp] = useState("");
  const [weight, setWeight] = useState("");
  const [gearWeight, setGearWeight] = useState("12");
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
  const router = useRouter();

  const isLocked = profile?.power_settings_locked ?? false;

  useEffect(() => {
    fetchUserAndProfile();
    fetchSubscription();
  }, []);

  // Update active section when URL param changes
  useEffect(() => {
    const section = searchParams.get("section") as SettingsSection;
    if (section && navItems.some((item) => item.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  async function fetchSubscription() {
    try {
      const response = await fetch("/api/subscription/status");
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setSubscription({
            isPremium: result.data.isPremium,
            status: result.data.status,
            isLifetime: result.data.isLifetime || false,
            currentPeriodEnd: result.data.subscription?.currentPeriodEnd || null,
            cancelAtPeriodEnd: result.data.subscription?.cancelAtPeriodEnd || false,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  }

  async function openBillingPortal() {
    setBillingLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to open billing portal");
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to open billing portal");
      setBillingLoading(false);
    }
  }

  async function handleUpgrade() {
    setBillingLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceKey: "annual",
          successUrl: `${window.location.origin}/dashboard/settings?section=billing&success=true`,
          cancelUrl: `${window.location.origin}/dashboard/settings?section=billing`,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start upgrade");
      setBillingLoading(false);
    }
  }

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
      setGearWeight(profileData.gear_weight_kg?.toString() || "12");
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

  const getDisplayGearWeight = () => {
    if (!gearWeight) return "";
    const kg = parseFloat(gearWeight);
    if (isNaN(kg)) return "";
    return preferredUnits === "imperial" ? kgToLbs(kg).toFixed(1) : kg.toFixed(1);
  };

  const handleGearWeightChange = (value: string) => {
    if (!value) {
      setGearWeight("12");
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    const kgValue = preferredUnits === "imperial" ? lbsToKg(numValue) : numValue;
    setGearWeight(kgValue.toString());
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
      gear_weight_kg: gearWeight ? parseFloat(gearWeight) : 12,
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
      toast.success("Athlete profile saved");
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
      toast.success("Nutrition preferences saved");
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
      updateUnitsCache(preferredUnits);
      toast.success("Preferences saved");
    }
    setSaving(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-sky-500" />
          <p className="text-sm text-brand-navy-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-brand-navy-600">Manage your profile, preferences, and integrations</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-24 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                    isActive
                      ? "bg-brand-sky-50 text-brand-sky-700"
                      : "text-brand-navy-600 hover:bg-brand-navy-50 hover:text-brand-navy-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-brand-sky-500" : "text-brand-navy-400")} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", isActive && "text-brand-sky-700")}>{item.label}</p>
                    <p className="text-xs text-brand-navy-400 truncate">{item.description}</p>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 flex-shrink-0 transition-transform", isActive ? "text-brand-sky-400 rotate-90" : "text-brand-navy-300")} />
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 max-w-2xl">
          {/* Profile Section */}
          {activeSection === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-navy-900">Profile</h2>
                <p className="text-sm text-brand-navy-500">Your public identity on FinalClimb</p>
              </div>

              <div className="bg-white rounded-xl border border-brand-navy-200 divide-y divide-brand-navy-100">
                {/* Avatar */}
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand-navy-100 to-brand-navy-200 overflow-hidden flex items-center justify-center ring-4 ring-white shadow-lg">
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt="Profile" width={96} height={96} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-12 w-12 text-brand-navy-400" />
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 p-2 rounded-full bg-brand-sky-500 text-white hover:bg-brand-sky-600 transition-colors disabled:opacity-50 shadow-lg"
                      >
                        {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="font-medium text-brand-navy-900">Profile Photo</h3>
                      <p className="text-sm text-brand-navy-500 mt-1">This will be displayed on your public profile and in discussions.</p>
                      <p className="text-xs text-brand-navy-400 mt-2">JPG, PNG or GIF. Max 10MB. Auto-compressed to 400x400.</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="p-6">
                  <Label htmlFor="name" className="text-brand-navy-700">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 max-w-md"
                  />
                  <p className="text-xs text-brand-navy-400 mt-2">This is how you&apos;ll appear to other users</p>
                </div>

                {/* Email */}
                <div className="p-6">
                  <Label htmlFor="email" className="text-brand-navy-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="mt-2 max-w-md bg-brand-navy-50"
                  />
                  <p className="text-xs text-brand-navy-400 mt-2">Your email address cannot be changed</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving === "profile"}>
                  {saving === "profile" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Athlete Profile Section */}
          {activeSection === "athlete" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-brand-navy-900">Athlete Profile</h2>
                  <p className="text-sm text-brand-navy-500">Your fitness metrics and power zones</p>
                </div>
                {isLocked && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-full text-amber-700 text-sm font-medium">
                    <Lock className="h-3.5 w-3.5" />
                    Locked by Coach
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-brand-navy-200 divide-y divide-brand-navy-100">
                {/* Base Metrics */}
                <div className="p-6">
                  <h3 className="font-medium text-brand-navy-900 mb-4">Base Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ftp">FTP (watts)</Label>
                      <Input id="ftp" type="number" placeholder="250" className="mt-2 font-mono" value={ftp} onChange={(e) => setFtp(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="weight">Body Weight ({preferredUnits === "imperial" ? "lbs" : "kg"})</Label>
                      <Input id="weight" type="number" step="0.1" placeholder={preferredUnits === "imperial" ? "154" : "70"} className="mt-2 font-mono" value={getDisplayWeight()} onChange={(e) => handleWeightChange(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="gear-weight">Gear Weight ({preferredUnits === "imperial" ? "lbs" : "kg"})</Label>
                      <Input id="gear-weight" type="number" step="0.1" placeholder={preferredUnits === "imperial" ? "26" : "12"} className="mt-2 font-mono" value={getDisplayGearWeight()} onChange={(e) => handleGearWeightChange(e.target.value)} />
                      <p className="text-xs text-brand-navy-400 mt-1">Bike + hydration + gear</p>
                    </div>
                    <div>
                      <Label htmlFor="altitude">Altitude Adjustment (%)</Label>
                      <Input id="altitude" type="number" step="1" min="0" max="50" placeholder="20" className="mt-2 font-mono" value={altitudeAdjustment} onChange={(e) => setAltitudeAdjustment(e.target.value)} disabled={isLocked} />
                      <p className="text-xs text-brand-navy-400 mt-1">For races above 4,000 ft</p>
                    </div>
                  </div>
                </div>

                {/* Intensity Factors */}
                <div className="p-6">
                  <h3 className="font-medium text-brand-navy-900 mb-1">Intensity Factors</h3>
                  <p className="text-sm text-brand-navy-500 mb-4">Your target power as a percentage of FTP for each effort level</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="if-safe" className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Safe
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input id="if-safe" type="number" min="50" max="80" className="font-mono" value={ifSafe} onChange={(e) => setIfSafe(e.target.value)} disabled={isLocked} />
                        <span className="text-sm text-brand-navy-500">%</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="if-tempo" className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Tempo
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input id="if-tempo" type="number" min="55" max="85" className="font-mono" value={ifTempo} onChange={(e) => setIfTempo(e.target.value)} disabled={isLocked} />
                        <span className="text-sm text-brand-navy-500">%</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="if-pushing" className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Pushing
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input id="if-pushing" type="number" min="60" max="90" className="font-mono" value={ifPushing} onChange={(e) => setIfPushing(e.target.value)} disabled={isLocked} />
                        <span className="text-sm text-brand-navy-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculated Power Targets */}
                {powerTargets && (
                  <div className="p-6 bg-brand-navy-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-brand-navy-900">Calculated Power Targets</h3>
                      {weight && (
                        <div className="text-sm">
                          <span className="text-brand-navy-500">W/kg:</span>
                          <span className="ml-2 font-mono font-semibold text-brand-navy-900">
                            {(powerTargets.baseFtp / parseFloat(weight)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Target NP Row */}
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="text-brand-navy-600 font-medium">Target NP</div>
                        <div className="text-center">
                          <div className="font-mono font-bold text-emerald-700 bg-emerald-50 rounded-lg py-2">{powerTargets.adjustedNP.safe}w</div>
                          <div className="text-xs text-brand-navy-400 mt-1">Safe</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono font-bold text-amber-700 bg-amber-50 rounded-lg py-2">{powerTargets.adjustedNP.tempo}w</div>
                          <div className="text-xs text-brand-navy-400 mt-1">Tempo</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono font-bold text-red-700 bg-red-50 rounded-lg py-2">{powerTargets.adjustedNP.pushing}w</div>
                          <div className="text-xs text-brand-navy-400 mt-1">Pushing</div>
                        </div>
                      </div>

                      {/* Climbing Row */}
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="text-brand-navy-600 flex items-center gap-1.5">
                          <Mountain className="h-4 w-4 text-brand-navy-400" />
                          Climbing (+20%)
                        </div>
                        <div className="text-center font-mono text-emerald-700 bg-white rounded-lg py-2 border border-brand-navy-100">{powerTargets.climbingPower.safe}w</div>
                        <div className="text-center font-mono text-amber-700 bg-white rounded-lg py-2 border border-brand-navy-100">{powerTargets.climbingPower.tempo}w</div>
                        <div className="text-center font-mono text-red-700 bg-white rounded-lg py-2 border border-brand-navy-100">{powerTargets.climbingPower.pushing}w</div>
                      </div>

                      {/* Flats Row */}
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="text-brand-navy-600 flex items-center gap-1.5">
                          <Minus className="h-4 w-4 text-brand-navy-400" />
                          Flats (-10%)
                        </div>
                        <div className="text-center font-mono text-emerald-700 bg-white rounded-lg py-2 border border-brand-navy-100">{powerTargets.flatPower.safe}w</div>
                        <div className="text-center font-mono text-amber-700 bg-white rounded-lg py-2 border border-brand-navy-100">{powerTargets.flatPower.tempo}w</div>
                        <div className="text-center font-mono text-red-700 bg-white rounded-lg py-2 border border-brand-navy-100">{powerTargets.flatPower.pushing}w</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={savePowerSettings} disabled={saving === "power" || isLocked}>
                  {saving === "power" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Athlete Profile
                </Button>
              </div>
            </div>
          )}

          {/* Nutrition Section */}
          {activeSection === "nutrition" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-navy-900">Nutrition Preferences</h2>
                <p className="text-sm text-brand-navy-500">Your hourly fueling targets based on your gut tolerance</p>
              </div>

              <div className="bg-white rounded-xl border border-brand-navy-200 p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="carbs" className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Carbs
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input id="carbs" type="number" placeholder="90" className="font-mono" value={carbsPerHour} onChange={(e) => setCarbsPerHour(e.target.value)} />
                      <span className="text-sm text-brand-navy-500 whitespace-nowrap">g/hr</span>
                    </div>
                    <p className="text-xs text-brand-navy-400 mt-2">Typical: 60-120g</p>
                  </div>
                  <div>
                    <Label htmlFor="fluid" className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Fluid
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input id="fluid" type="number" placeholder="750" className="font-mono" value={fluidPerHour} onChange={(e) => setFluidPerHour(e.target.value)} />
                      <span className="text-sm text-brand-navy-500 whitespace-nowrap">ml/hr</span>
                    </div>
                    <p className="text-xs text-brand-navy-400 mt-2">Typical: 500-1000ml</p>
                  </div>
                  <div>
                    <Label htmlFor="sodium" className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Sodium
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input id="sodium" type="number" placeholder="750" className="font-mono" value={sodiumPerHour} onChange={(e) => setSodiumPerHour(e.target.value)} />
                      <span className="text-sm text-brand-navy-500 whitespace-nowrap">mg/hr</span>
                    </div>
                    <p className="text-xs text-brand-navy-400 mt-2">Typical: 500-1500mg</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-brand-sky-50 rounded-lg">
                  <p className="text-sm text-brand-sky-800">
                    <strong>Tip:</strong> These are your personal defaults based on what you can tolerate. They&apos;re used as starting points for race-specific nutrition plans, which can be customized per event.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveNutrition} disabled={saving === "nutrition"}>
                  {saving === "nutrition" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Nutrition
                </Button>
              </div>
            </div>
          )}

          {/* Preferences Section */}
          {activeSection === "preferences" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-navy-900">Preferences</h2>
                <p className="text-sm text-brand-navy-500">Customize your experience</p>
              </div>

              <div className="bg-white rounded-xl border border-brand-navy-200 divide-y divide-brand-navy-100">
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-brand-navy-900">Units</h3>
                    <p className="text-sm text-brand-navy-500 mt-0.5">Display distances and weights</p>
                  </div>
                  <select
                    className="px-4 py-2 border border-brand-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-sky-400 bg-white"
                    value={preferredUnits}
                    onChange={(e) => setPreferredUnits(e.target.value as "metric" | "imperial")}
                  >
                    <option value="imperial">Imperial (mi, lb)</option>
                    <option value="metric">Metric (km, kg)</option>
                  </select>
                </div>

                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-brand-navy-900">Public Profile</h3>
                    <p className="text-sm text-brand-navy-500 mt-0.5">Allow others to see your profile and gear setups</p>
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
                    <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm", publicProfile ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={savePreferences} disabled={saving === "preferences"}>
                  {saving === "preferences" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </div>
            </div>
          )}

          {/* Billing Section */}
          {activeSection === "billing" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-navy-900">Billing & Subscription</h2>
                <p className="text-sm text-brand-navy-500">Manage your subscription and payment methods</p>
              </div>

              {/* Current Plan Card */}
              <div className={cn(
                "rounded-xl border p-6",
                subscription?.isPremium
                  ? "bg-gradient-to-br from-brand-sky-50 to-white border-brand-sky-200"
                  : "bg-white border-brand-navy-200"
              )}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {subscription?.isPremium ? (
                        subscription.isLifetime ? (
                          <Crown className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Sparkles className="h-5 w-5 text-brand-sky-500" />
                        )
                      ) : (
                        <User className="h-5 w-5 text-brand-navy-400" />
                      )}
                      <h3 className="font-semibold text-brand-navy-900">
                        {subscription?.isPremium
                          ? subscription.isLifetime
                            ? "Lifetime Member"
                            : "Premium"
                          : "Free Plan"}
                      </h3>
                      {subscription?.isPremium && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          subscription.isLifetime
                            ? "bg-amber-100 text-amber-700"
                            : "bg-brand-sky-100 text-brand-sky-700"
                        )}>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-brand-navy-600">
                      {subscription?.isPremium
                        ? subscription.isLifetime
                          ? "You have lifetime access to all premium features."
                          : subscription.cancelAtPeriodEnd
                            ? "Your subscription will end on " + (subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "renewal date")
                            : "Full access to all features. Renews " + (subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "annually")
                        : "Upgrade to unlock race plans, Garmin sync, exports, and more."}
                    </p>
                  </div>
                  {subscription?.isPremium && !subscription.isLifetime && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-brand-navy-900">$29</div>
                      <div className="text-sm text-brand-navy-500">/year</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  {subscription?.isPremium ? (
                    !subscription.isLifetime && (
                      <Button
                        onClick={openBillingPortal}
                        disabled={billingLoading}
                        variant="outline"
                        className="gap-2"
                      >
                        {billingLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        Manage Subscription
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={handleUpgrade}
                      disabled={billingLoading}
                      className="gap-2 bg-brand-sky-500 hover:bg-brand-sky-600"
                    >
                      {billingLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Upgrade to Premium
                    </Button>
                  )}
                </div>
              </div>

              {/* Premium Features List */}
              {!subscription?.isPremium && (
                <div className="bg-white rounded-xl border border-brand-navy-200 p-6">
                  <h3 className="font-semibold text-brand-navy-900 mb-4">What you get with Premium</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { icon: "map", text: "Unlimited race plans" },
                      { icon: "watch", text: "Garmin sync" },
                      { icon: "download", text: "PDF exports & stickers" },
                      { icon: "bike", text: "Gear tracking" },
                      { icon: "checklist", text: "Packing checklists" },
                      { icon: "messages", text: "Discussion posts" },
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-brand-navy-600">
                        <Check className="h-4 w-4 text-brand-sky-500 flex-shrink-0" />
                        {feature.text}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-brand-navy-100 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-brand-navy-900">$29</span>
                      <span className="text-brand-navy-500">/year</span>
                      <span className="ml-2 text-sm text-brand-navy-400">or $79 lifetime</span>
                    </div>
                    <a
                      href="/pricing"
                      className="text-sm text-brand-sky-600 hover:text-brand-sky-700 font-medium"
                    >
                      View pricing details →
                    </a>
                  </div>
                </div>
              )}

              {/* Payment History Link */}
              {subscription?.isPremium && !subscription.isLifetime && (
                <div className="bg-white rounded-xl border border-brand-navy-200 divide-y divide-brand-navy-100">
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-brand-navy-900">Payment History & Invoices</h3>
                      <p className="text-sm text-brand-navy-500 mt-0.5">View and download past invoices</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={openBillingPortal}
                      disabled={billingLoading}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Invoices
                    </Button>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-brand-navy-900">Payment Method</h3>
                      <p className="text-sm text-brand-navy-500 mt-0.5">Update your card or payment details</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={openBillingPortal}
                      disabled={billingLoading}
                      className="gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Update
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-navy-900">Notifications</h2>
                <p className="text-sm text-brand-navy-500">Manage how you receive updates</p>
              </div>

              <div className="bg-white rounded-xl border border-brand-navy-200 p-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-navy-100 flex items-center justify-center mb-4">
                    <Bell className="h-6 w-6 text-brand-navy-400" />
                  </div>
                  <h3 className="font-medium text-brand-navy-900">Coming Soon</h3>
                  <p className="text-sm text-brand-navy-500 mt-1 max-w-sm">
                    Email and push notification preferences will be available here. For now, you&apos;ll receive in-app notifications automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Section */}
          {activeSection === "integrations" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-navy-900">Integrations</h2>
                <p className="text-sm text-brand-navy-500">Connect your favorite apps and devices</p>
              </div>

              <div className="bg-white rounded-xl border border-brand-navy-200 p-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-navy-100 flex items-center justify-center mb-4">
                    <Link2 className="h-6 w-6 text-brand-navy-400" />
                  </div>
                  <h3 className="font-medium text-brand-navy-900">Coming Soon</h3>
                  <p className="text-sm text-brand-navy-500 mt-1 max-w-sm">
                    Connect with Strava, Garmin, Wahoo, and more to sync your activities and power data automatically.
                  </p>
                  <div className="flex items-center gap-4 mt-6 opacity-50">
                    <div className="px-4 py-2 bg-brand-navy-50 rounded-lg text-sm text-brand-navy-600">Strava</div>
                    <div className="px-4 py-2 bg-brand-navy-50 rounded-lg text-sm text-brand-navy-600">Garmin</div>
                    <div className="px-4 py-2 bg-brand-navy-50 rounded-lg text-sm text-brand-navy-600">Wahoo</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Section */}
          {activeSection === "account" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-navy-900">Account</h2>
                <p className="text-sm text-brand-navy-500">Manage your account settings</p>
              </div>

              <div className="bg-white rounded-xl border border-brand-navy-200 divide-y divide-brand-navy-100">
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-brand-navy-900">Sign Out</h3>
                    <p className="text-sm text-brand-navy-500 mt-0.5">Sign out of FinalClimb on this device</p>
                  </div>
                  <Button variant="outline" onClick={handleLogout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                  <h3 className="font-medium text-red-700 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Danger Zone
                  </h3>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-brand-navy-900">Delete Account</h4>
                    <p className="text-sm text-brand-navy-500 mt-0.5">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
