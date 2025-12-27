"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { calculateAllPowerTargets } from "@/lib/calculations/power";
import { updateUnitsCache } from "@/hooks";
import { kgToLbs, lbsToKg } from "@/lib/utils";
import type {
  AthleteProfile,
  UserProfile,
  SubscriptionData,
  SettingsFormState,
} from "@/types/settings";

export function useSettingsData() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form state
  const [formState, setFormState] = useState<SettingsFormState>({
    firstName: "",
    lastName: "",
    avatarUrl: null,
    city: "",
    state: "",
    ftp: "",
    weight: "",
    gearWeight: "12",
    altitudeAdjustment: "",
    ifSafe: "67",
    ifTempo: "70",
    ifPushing: "73",
    carbsPerHour: "",
    fluidPerHour: "",
    sodiumPerHour: "",
    preferredUnits: "imperial",
    publicProfile: false,
  });

  const supabase = createClient();
  const router = useRouter();

  const isLocked = profile?.power_settings_locked ?? false;

  // Update form field helper
  const updateFormField = useCallback(
    <K extends keyof SettingsFormState>(field: K, value: SettingsFormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Weight display/input helpers
  const getDisplayWeight = useCallback(() => {
    if (!formState.weight) return "";
    const kg = parseFloat(formState.weight);
    if (isNaN(kg)) return "";
    return formState.preferredUnits === "imperial"
      ? kgToLbs(kg).toFixed(1)
      : kg.toFixed(1);
  }, [formState.weight, formState.preferredUnits]);

  const handleWeightChange = useCallback(
    (value: string) => {
      if (!value) {
        updateFormField("weight", "");
        return;
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;
      const kgValue =
        formState.preferredUnits === "imperial" ? lbsToKg(numValue) : numValue;
      updateFormField("weight", kgValue.toString());
    },
    [formState.preferredUnits, updateFormField]
  );

  const getDisplayGearWeight = useCallback(() => {
    if (!formState.gearWeight) return "";
    const kg = parseFloat(formState.gearWeight);
    if (isNaN(kg)) return "";
    return formState.preferredUnits === "imperial"
      ? kgToLbs(kg).toFixed(1)
      : kg.toFixed(1);
  }, [formState.gearWeight, formState.preferredUnits]);

  const handleGearWeightChange = useCallback(
    (value: string) => {
      if (!value) {
        updateFormField("gearWeight", "12");
        return;
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;
      const kgValue =
        formState.preferredUnits === "imperial" ? lbsToKg(numValue) : numValue;
      updateFormField("gearWeight", kgValue.toString());
    },
    [formState.preferredUnits, updateFormField]
  );

  // Calculated power targets
  const powerTargets = useMemo(() => {
    const ftpValue = parseFloat(formState.ftp) || 0;
    if (ftpValue === 0) return null;

    return calculateAllPowerTargets(
      ftpValue,
      (parseFloat(formState.altitudeAdjustment) || 20) / 100,
      {
        safe: (parseFloat(formState.ifSafe) || 67) / 100,
        tempo: (parseFloat(formState.ifTempo) || 70) / 100,
        pushing: (parseFloat(formState.ifPushing) || 73) / 100,
      }
    );
  }, [
    formState.ftp,
    formState.altitudeAdjustment,
    formState.ifSafe,
    formState.ifTempo,
    formState.ifPushing,
  ]);

  // Fetch user and profile data
  const fetchUserAndProfile = useCallback(async () => {
    setLoading(true);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, city, state, profile_public, avatar_url")
      .eq("id", authUser.id)
      .single();

    if (userData) {
      setUser(userData);
      setFormState((prev) => ({
        ...prev,
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
        city: userData.city || "",
        state: userData.state || "",
        publicProfile: userData.profile_public || false,
        avatarUrl: userData.avatar_url,
      }));
    }

    const { data: profileData } = await supabase
      .from("athlete_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFormState((prev) => ({
        ...prev,
        ftp: profileData.ftp_watts?.toString() || "",
        weight: profileData.weight_kg?.toString() || "",
        gearWeight: profileData.gear_weight_kg?.toString() || "12",
        altitudeAdjustment: (
          (profileData.altitude_adjustment_factor || 0.2) * 100
        ).toString(),
        ifSafe: ((profileData.if_safe || 0.67) * 100).toString(),
        ifTempo: ((profileData.if_tempo || 0.7) * 100).toString(),
        ifPushing: ((profileData.if_pushing || 0.73) * 100).toString(),
        carbsPerHour: profileData.nutrition_cho_per_hour?.toString() || "90",
        fluidPerHour: profileData.hydration_ml_per_hour?.toString() || "750",
        sodiumPerHour: profileData.sodium_mg_per_hour?.toString() || "750",
        preferredUnits: profileData.preferred_units || "imperial",
      }));
    }

    setLoading(false);
  }, [supabase]);

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
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
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchUserAndProfile();
    fetchSubscription();
  }, [fetchUserAndProfile, fetchSubscription]);

  // Save functions
  const saveProfile = useCallback(async () => {
    if (!user || saving) return;
    setSaving("profile");

    const { error } = await supabase
      .from("users")
      .update({
        first_name: formState.firstName || null,
        last_name: formState.lastName || null,
        city: formState.city || null,
        state: formState.state || null,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile saved");
    }
    setSaving(null);
  }, [user, saving, formState.firstName, formState.lastName, formState.city, formState.state, supabase]);

  const savePowerSettings = useCallback(async () => {
    if (!user || saving || isLocked) return;
    setSaving("power");

    const updates = {
      user_id: user.id,
      ftp_watts: formState.ftp ? parseInt(formState.ftp) : null,
      weight_kg: formState.weight ? parseFloat(formState.weight) : null,
      gear_weight_kg: formState.gearWeight ? parseFloat(formState.gearWeight) : 12,
      altitude_adjustment_factor: formState.altitudeAdjustment
        ? parseFloat(formState.altitudeAdjustment) / 100
        : 0.2,
      if_safe: formState.ifSafe ? parseFloat(formState.ifSafe) / 100 : 0.67,
      if_tempo: formState.ifTempo ? parseFloat(formState.ifTempo) / 100 : 0.7,
      if_pushing: formState.ifPushing ? parseFloat(formState.ifPushing) / 100 : 0.73,
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
  }, [user, saving, isLocked, formState, supabase]);

  const saveNutrition = useCallback(async () => {
    if (!user || saving) return;
    setSaving("nutrition");

    const updates = {
      user_id: user.id,
      nutrition_cho_per_hour: formState.carbsPerHour
        ? parseInt(formState.carbsPerHour)
        : 90,
      hydration_ml_per_hour: formState.fluidPerHour
        ? parseInt(formState.fluidPerHour)
        : 750,
      sodium_mg_per_hour: formState.sodiumPerHour
        ? parseInt(formState.sodiumPerHour)
        : 750,
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
  }, [user, saving, formState, supabase]);

  const savePreferences = useCallback(async () => {
    if (!user || saving) return;
    setSaving("preferences");

    const { error: profileError } = await supabase
      .from("athlete_profiles")
      .upsert(
        { user_id: user.id, preferred_units: formState.preferredUnits },
        { onConflict: "user_id" }
      );

    const { error: userError } = await supabase
      .from("users")
      .update({ profile_public: formState.publicProfile })
      .eq("id", user.id);

    if (profileError || userError) {
      toast.error("Failed to save preferences");
      console.error(profileError || userError);
    } else {
      updateUnitsCache(formState.preferredUnits);
      toast.success("Preferences saved");
    }
    setSaving(null);
  }, [user, saving, formState.preferredUnits, formState.publicProfile, supabase]);

  // Billing functions
  const openBillingPortal = useCallback(async () => {
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
      toast.error(
        error instanceof Error ? error.message : "Failed to open billing portal"
      );
      setBillingLoading(false);
    }
  }, []);

  const handleUpgrade = useCallback(async () => {
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
      toast.error(
        error instanceof Error ? error.message : "Failed to start upgrade"
      );
      setBillingLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  return {
    // Loading states
    loading,
    saving,
    billingLoading,
    uploadingAvatar,
    setUploadingAvatar,

    // Data
    user,
    profile,
    subscription,
    isLocked,

    // Form state
    formState,
    updateFormField,

    // Weight helpers
    getDisplayWeight,
    handleWeightChange,
    getDisplayGearWeight,
    handleGearWeightChange,

    // Calculated values
    powerTargets,

    // Save functions
    saveProfile,
    savePowerSettings,
    saveNutrition,
    savePreferences,

    // Billing functions
    openBillingPortal,
    handleUpgrade,

    // Auth
    handleLogout,

    // Supabase (for avatar upload)
    supabase,
  };
}
