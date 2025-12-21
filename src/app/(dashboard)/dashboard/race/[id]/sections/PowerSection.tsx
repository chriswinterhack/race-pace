"use client";

import { useState, useEffect } from "react";
import { Zap, Mountain, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  calculateAltitudeAdjustedFTP,
  calculateTargetNP,
  calculateTerrainPower,
} from "@/lib/calculations";

interface RacePlan {
  id: string;
  goal_time_minutes: number | null;
  race_distance: {
    elevation_high: number | null;
  };
}

interface AthleteProfile {
  ftp_watts: number | null;
  weight_kg: number | null;
  altitude_adjustment_factor: number | null;
}

interface PowerSectionProps {
  plan: RacePlan;
}

export function PowerSection({ plan: _plan }: PowerSectionProps) {
  // plan is available for future use (elevation_high for altitude adjustment)
  void _plan;
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("athlete_profiles")
      .select("ftp_watts, weight_kg, altitude_adjustment_factor")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 bg-brand-navy-100 rounded" />
        <div className="h-32 bg-brand-navy-100 rounded" />
      </div>
    );
  }

  if (!profile?.ftp_watts) {
    return (
      <div className="text-center py-12 bg-brand-navy-50 rounded-lg">
        <Zap className="h-8 w-8 text-brand-navy-300 mx-auto mb-3" />
        <p className="text-brand-navy-600 mb-2">No FTP set</p>
        <p className="text-sm text-brand-navy-500">
          Set your FTP in your profile to see power targets
        </p>
      </div>
    );
  }

  const altitudeFactor = profile.altitude_adjustment_factor ?? 0.2;
  const adjustedFTP = calculateAltitudeAdjustedFTP(profile.ftp_watts, altitudeFactor);

  const effortLevels = [
    { key: "safe" as const, label: "Safe", color: "emerald" },
    { key: "tempo" as const, label: "Tempo", color: "amber" },
    { key: "pushing" as const, label: "Pushing", color: "red" },
  ];

  const terrainTypes = [
    { key: "climb" as const, label: "Climbing", icon: Mountain },
    { key: "flat" as const, label: "Flat/Rolling", icon: Minus },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-brand-navy-900">Power Targets</h3>
        <p className="mt-1 text-sm text-brand-navy-600">
          Power zones adjusted for altitude and terrain
        </p>
      </div>

      {/* FTP Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-4 rounded-lg bg-brand-navy-50">
          <p className="text-sm text-brand-navy-600">Your FTP</p>
          <p className="text-2xl font-bold text-brand-navy-900 font-mono">
            {profile.ftp_watts}w
          </p>
        </div>
        <div className="p-4 rounded-lg bg-brand-sky-50">
          <p className="text-sm text-brand-navy-600">Altitude Adjusted</p>
          <p className="text-2xl font-bold text-brand-navy-900 font-mono">
            {Math.round(adjustedFTP)}w
          </p>
          <p className="text-xs text-brand-navy-500">
            -{Math.round(altitudeFactor * 100)}% for altitude
          </p>
        </div>
        {profile.weight_kg && (
          <div className="p-4 rounded-lg bg-brand-navy-50">
            <p className="text-sm text-brand-navy-600">W/kg</p>
            <p className="text-2xl font-bold text-brand-navy-900 font-mono">
              {(profile.ftp_watts / profile.weight_kg).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Power Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-brand-navy-600">
                Terrain
              </th>
              {effortLevels.map((effort) => (
                <th
                  key={effort.key}
                  className={cn(
                    "text-center py-3 px-4 text-sm font-medium",
                    effort.color === "emerald" && "text-emerald-700",
                    effort.color === "amber" && "text-amber-700",
                    effort.color === "red" && "text-red-700"
                  )}
                >
                  {effort.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {terrainTypes.map((terrain) => {
              const Icon = terrain.icon;
              return (
                <tr key={terrain.key} className="border-t border-brand-navy-100">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-brand-navy-500" />
                      <span className="font-medium text-brand-navy-900">
                        {terrain.label}
                      </span>
                    </div>
                  </td>
                  {effortLevels.map((effort) => {
                    const targetNP = calculateTargetNP(adjustedFTP, effort.key);
                    const terrainPower = calculateTerrainPower(targetNP, terrain.key);
                    const lowPower = Math.round(terrainPower * 0.95);
                    const highPower = Math.round(terrainPower * 1.05);

                    return (
                      <td key={effort.key} className="py-4 px-4 text-center">
                        <div className={cn(
                          "inline-block px-4 py-2 rounded-lg font-mono font-bold",
                          effort.color === "emerald" && "bg-emerald-100 text-emerald-800",
                          effort.color === "amber" && "bg-amber-100 text-amber-800",
                          effort.color === "red" && "bg-red-100 text-red-800"
                        )}>
                          {lowPower}-{highPower}w
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Explanation */}
      <div className="p-4 rounded-lg bg-brand-navy-50 text-sm text-brand-navy-600">
        <p className="font-medium text-brand-navy-900 mb-2">Power Zone Guidance</p>
        <ul className="space-y-1">
          <li><span className="text-emerald-700 font-medium">Safe:</span> Conservative effort, preserving energy for later</li>
          <li><span className="text-amber-700 font-medium">Tempo:</span> Sustainable race pace, primary target zone</li>
          <li><span className="text-red-700 font-medium">Pushing:</span> Maximum sustainable effort, use sparingly</li>
        </ul>
      </div>
    </div>
  );
}
