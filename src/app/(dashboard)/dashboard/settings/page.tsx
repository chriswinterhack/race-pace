"use client";

import { useState, useEffect } from "react";
import { User, Activity, Droplets, Bell, Shield, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AthleteProfile {
  id: string;
  user_id: string;
  weight_kg: number | null;
  ftp_watts: number | null;
  altitude_adjustment_factor: number | null;
  nutrition_cho_per_hour: number | null;
  hydration_ml_per_hour: number | null;
  sodium_mg_per_hour: number | null;
  preferred_units: "metric" | "imperial";
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [_profile, setProfile] = useState<AthleteProfile | null>(null);
  void _profile; // Profile state used for future features

  // Form state
  const [name, setName] = useState("");
  const [ftp, setFtp] = useState("");
  const [weight, setWeight] = useState("");
  const [altitudeAdjustment, setAltitudeAdjustment] = useState("");
  const [carbsPerHour, setCarbsPerHour] = useState("");
  const [fluidPerHour, setFluidPerHour] = useState("");
  const [sodiumPerHour, setSodiumPerHour] = useState("");
  const [preferredUnits, setPreferredUnits] = useState<"metric" | "imperial">("imperial");
  const [publicProfile, setPublicProfile] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchUserAndProfile();
  }, []);

  async function fetchUserAndProfile() {
    setLoading(true);

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      return;
    }

    // Fetch user profile
    const { data: userData } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", authUser.id)
      .single();

    if (userData) {
      setUser(userData);
      setName(userData.name || "");
    }

    // Fetch athlete profile
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
      setCarbsPerHour(profileData.nutrition_cho_per_hour?.toString() || "90");
      setFluidPerHour(profileData.hydration_ml_per_hour?.toString() || "750");
      setSodiumPerHour(profileData.sodium_mg_per_hour?.toString() || "750");
      setPreferredUnits(profileData.preferred_units || "imperial");
    }

    setLoading(false);
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

  async function saveMetrics() {
    if (!user || saving) return;
    setSaving("metrics");

    const updates = {
      user_id: user.id,
      ftp_watts: ftp ? parseInt(ftp) : null,
      weight_kg: weight ? parseFloat(weight) : null,
      altitude_adjustment_factor: altitudeAdjustment ? parseFloat(altitudeAdjustment) / 100 : 0.20,
    };

    const { error } = await supabase
      .from("athlete_profiles")
      .upsert(updates, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to save metrics");
      console.error(error);
    } else {
      toast.success("Athlete metrics saved");
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
      toast.success("Nutrition targets saved");
    }
    setSaving(null);
  }

  async function savePreferences(units: "metric" | "imperial") {
    if (!user) return;
    setPreferredUnits(units);
    setSaving("preferences");

    const { error } = await supabase
      .from("athlete_profiles")
      .upsert({ user_id: user.id, preferred_units: units }, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to save preferences");
      console.error(error);
    } else {
      toast.success("Preferences saved");
    }
    setSaving(null);
  }

  // Weight is always stored and edited in kg
  // Show conversion helper for imperial users
  const weightInLbs = weight ? (parseFloat(weight) * 2.20462).toFixed(1) : "";

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
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
          Settings
        </h1>
        <p className="mt-1 text-brand-navy-600">
          Manage your profile and preferences
        </p>
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
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
              />
              <p className="text-xs text-brand-navy-500">
                Email cannot be changed
              </p>
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={saveProfile}
              disabled={saving === "profile"}
            >
              {saving === "profile" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Athlete Metrics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Athlete Metrics</CardTitle>
                <CardDescription>Used for power calculations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ftp">FTP (watts)</Label>
                <Input
                  id="ftp"
                  type="number"
                  placeholder="250"
                  className="font-mono"
                  value={ftp}
                  onChange={(e) => setFtp(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="70"
                  className="font-mono"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                {weight && (
                  <p className="text-xs text-brand-navy-500">
                    = {weightInLbs} lbs
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="altitude">Altitude Adjustment (%)</Label>
              <Input
                id="altitude"
                type="number"
                step="1"
                min="0"
                max="50"
                placeholder="20"
                className="font-mono"
                value={altitudeAdjustment}
                onChange={(e) => setAltitudeAdjustment(e.target.value)}
              />
              <p className="text-xs text-brand-navy-500">
                Typical reduction: 15-25% for high altitude races (8,000+ ft)
              </p>
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={saveMetrics}
              disabled={saving === "metrics"}
            >
              {saving === "metrics" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Metrics
            </Button>
          </CardContent>
        </Card>

        {/* Nutrition Targets */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Droplets className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Nutrition Targets</CardTitle>
                <CardDescription>Hourly fueling goals</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g/hr)</Label>
                <Input
                  id="carbs"
                  type="number"
                  placeholder="90"
                  className="font-mono"
                  value={carbsPerHour}
                  onChange={(e) => setCarbsPerHour(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fluid">Fluid (ml/hr)</Label>
                <Input
                  id="fluid"
                  type="number"
                  placeholder="750"
                  className="font-mono"
                  value={fluidPerHour}
                  onChange={(e) => setFluidPerHour(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sodium">Sodium (mg/hr)</Label>
                <Input
                  id="sodium"
                  type="number"
                  placeholder="750"
                  className="font-mono"
                  value={sodiumPerHour}
                  onChange={(e) => setSodiumPerHour(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={saveNutrition}
              disabled={saving === "nutrition"}
            >
              {saving === "nutrition" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Targets
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Bell className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Preferences</CardTitle>
                <CardDescription>App settings and notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-brand-navy-900">Units</p>
                <p className="text-sm text-brand-navy-600">
                  Display distances and weights
                </p>
              </div>
              <select
                className="px-3 py-2 border border-brand-navy-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-sky-400"
                value={preferredUnits}
                onChange={(e) => savePreferences(e.target.value as "metric" | "imperial")}
              >
                <option value="imperial">Imperial (mi, lb)</option>
                <option value="metric">Metric (km, kg)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-brand-navy-900">Public Profile</p>
                <p className="text-sm text-brand-navy-600">
                  Allow others to see your profile
                </p>
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
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    publicProfile ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
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
              <p className="text-sm text-brand-navy-600">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
