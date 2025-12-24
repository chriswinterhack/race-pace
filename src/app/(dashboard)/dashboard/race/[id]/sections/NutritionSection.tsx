"use client";

import { useState, useEffect } from "react";
import { Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NutritionPlanner } from "@/components/nutrition-planner";

interface RaceDistance {
  elevation_high: number | null;
  start_time: string | null;
}

interface RacePlan {
  id: string;
  goal_time_minutes: number | null;
  start_time: string | null;
  race_distance: RaceDistance | null;
}

interface AthleteProfile {
  weight_kg: number | null;
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("athlete_profiles")
      .select("weight_kg")
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

  if (!plan.goal_time_minutes) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">
            Nutrition Plan
          </h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            Your fueling strategy for race day
          </p>
        </div>
        <div className="text-center py-12 bg-brand-navy-50 rounded-lg">
          <Utensils className="h-8 w-8 text-brand-navy-300 mx-auto mb-3" />
          <p className="text-brand-navy-600">
            Set a goal time to see nutrition requirements
          </p>
        </div>
      </div>
    );
  }

  // Calculate race duration in hours
  const raceDurationHours = plan.goal_time_minutes / 60;

  // Get max elevation (convert to feet if needed, default to 5000ft)
  const maxElevationFt = plan.race_distance?.elevation_high ?? 5000;

  // Get race start time
  const raceStartTime =
    plan.start_time ?? plan.race_distance?.start_time ?? "06:00";

  // Get athlete weight (default 75kg)
  const athleteWeightKg = profile?.weight_kg ?? 75;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-brand-navy-900">
          Nutrition Plan
        </h3>
        <p className="mt-1 text-sm text-brand-navy-600">
          Drag products to your timeline to build your race fueling strategy
        </p>
      </div>

      <div className="h-[800px] -mx-6 border-t border-brand-navy-200">
        <NutritionPlanner
          racePlanId={plan.id}
          raceDurationHours={raceDurationHours}
          maxElevationFt={maxElevationFt}
          raceStartTime={raceStartTime}
          athleteWeightKg={athleteWeightKg}
        />
      </div>
    </div>
  );
}
