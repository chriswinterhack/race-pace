"use client";

import { useState, useEffect } from "react";
import { Utensils, Droplets, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateTargetNP,
  calculateAltitudeAdjustedFTP,
  calculateRaceNutrition,
} from "@/lib/calculations";

interface RacePlan {
  id: string;
  goal_time_minutes: number | null;
}

interface AthleteProfile {
  ftp_watts: number | null;
  altitude_adjustment_factor: number | null;
  nutrition_cho_per_hour: number | null;
  hydration_ml_per_hour: number | null;
  sodium_mg_per_hour: number | null;
}

interface NutritionSectionProps {
  plan: RacePlan;
}

export function NutritionSection({ plan }: NutritionSectionProps) {
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
      .select("ftp_watts, altitude_adjustment_factor, nutrition_cho_per_hour, hydration_ml_per_hour, sodium_mg_per_hour")
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

  const raceTimeHours = (plan.goal_time_minutes || 0) / 60;
  const choPerHour = profile?.nutrition_cho_per_hour || 90;
  const hydrationPerHour = profile?.hydration_ml_per_hour || 750;
  const sodiumPerHour = profile?.sodium_mg_per_hour || 500;

  // Calculate energy if FTP is available
  let estimatedCalories = 0;
  if (profile?.ftp_watts && plan.goal_time_minutes) {
    const adjustedFTP = calculateAltitudeAdjustedFTP(
      profile.ftp_watts,
      profile.altitude_adjustment_factor ?? 0.2
    );
    const targetNP = calculateTargetNP(adjustedFTP, "tempo");
    const nutrition = calculateRaceNutrition(
      targetNP,
      raceTimeHours,
      choPerHour,
      hydrationPerHour,
      sodiumPerHour
    );
    estimatedCalories = nutrition.totalCalories;
  }

  const totalCHO = Math.round(choPerHour * raceTimeHours);
  const totalHydration = Math.round(hydrationPerHour * raceTimeHours);
  const totalSodium = Math.round(sodiumPerHour * raceTimeHours);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-brand-navy-900">Nutrition Plan</h3>
        <p className="mt-1 text-sm text-brand-navy-600">
          Your fueling strategy for race day
        </p>
      </div>

      {!plan.goal_time_minutes ? (
        <div className="text-center py-12 bg-brand-navy-50 rounded-lg">
          <Utensils className="h-8 w-8 text-brand-navy-300 mx-auto mb-3" />
          <p className="text-brand-navy-600">Set a goal time to see nutrition requirements</p>
        </div>
      ) : (
        <>
          {/* Hourly Targets */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Carbs</span>
              </div>
              <p className="text-2xl font-bold text-amber-900 font-mono">
                {choPerHour}g
                <span className="text-sm font-normal text-amber-600">/hr</span>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Hydration</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 font-mono">
                {hydrationPerHour}ml
                <span className="text-sm font-normal text-blue-600">/hr</span>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-600 text-sm font-bold">Na+</span>
                <span className="text-sm font-medium text-purple-700">Sodium</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 font-mono">
                {sodiumPerHour}mg
                <span className="text-sm font-normal text-purple-600">/hr</span>
              </p>
            </div>
          </div>

          {/* Race Totals */}
          <div className="p-4 rounded-lg bg-brand-navy-50">
            <h4 className="font-medium text-brand-navy-900 mb-4">
              Race Totals ({raceTimeHours.toFixed(1)} hours)
            </h4>
            <div className="grid gap-4 sm:grid-cols-4">
              {estimatedCalories > 0 && (
                <div>
                  <p className="text-sm text-brand-navy-600">Est. Calories Burned</p>
                  <p className="text-xl font-bold text-brand-navy-900 font-mono">
                    {estimatedCalories.toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-brand-navy-600">Total Carbs</p>
                <p className="text-xl font-bold text-brand-navy-900 font-mono">
                  {totalCHO}g
                </p>
              </div>
              <div>
                <p className="text-sm text-brand-navy-600">Total Fluids</p>
                <p className="text-xl font-bold text-brand-navy-900 font-mono">
                  {(totalHydration / 1000).toFixed(1)}L
                </p>
              </div>
              <div>
                <p className="text-sm text-brand-navy-600">Total Sodium</p>
                <p className="text-xl font-bold text-brand-navy-900 font-mono">
                  {(totalSodium / 1000).toFixed(1)}g
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="p-4 rounded-lg border border-brand-navy-200 text-sm">
            <p className="font-medium text-brand-navy-900 mb-2">Fueling Tips</p>
            <ul className="space-y-1 text-brand-navy-600">
              <li>• Start fueling early - within the first 30 minutes</li>
              <li>• Set a timer to remind yourself to eat/drink regularly</li>
              <li>• Practice your nutrition strategy during training</li>
              <li>• Adjust based on conditions (heat = more fluids/sodium)</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
