"use client";

import { useState, useEffect } from "react";
import { Utensils, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { NutritionPlanner } from "@/components/nutrition-planner";
import { NutritionPreview } from "@/components/nutrition-planner/NutritionPreview";
import { Button } from "@/components/ui";
import { usePremiumFeature } from "@/hooks/useSubscription";

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
  const [resetting, setResetting] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const supabase = createClient();

  const { canAccess: isPremium, isLoading: isPremiumLoading } = usePremiumFeature("Nutrition Planning");

  async function handleResetNutrition() {
    if (!window.confirm("Are you sure you want to clear ALL nutrition data for this race plan? This cannot be undone.")) {
      return;
    }

    setResetting(true);
    try {
      // Get the nutrition plan
      const { data: nutritionPlan } = await supabase
        .from("race_nutrition_plans")
        .select("id")
        .eq("race_plan_id", plan.id)
        .single();

      if (nutritionPlan) {
        // Delete all items
        await supabase
          .from("race_nutrition_plan_items")
          .delete()
          .eq("nutrition_plan_id", nutritionPlan.id);

        // Delete all water entries
        await supabase
          .from("race_nutrition_plan_water")
          .delete()
          .eq("nutrition_plan_id", nutritionPlan.id);

        toast.success("Nutrition plan cleared");
        // Force re-mount of NutritionPlanner
        setResetKey(k => k + 1);
      } else {
        toast.info("No nutrition data to clear");
      }
    } catch (err) {
      console.error("Error resetting nutrition:", err);
      toast.error("Failed to clear nutrition data");
    }
    setResetting(false);
  }

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

  if (loading || isPremiumLoading) {
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

  // Show preview for free users
  if (!isPremium) {
    return (
      <NutritionPreview
        raceDurationHours={raceDurationHours}
        maxElevationFt={maxElevationFt}
        athleteWeightKg={athleteWeightKg}
      />
    );
  }

  // Full nutrition planner for premium users
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">
            Nutrition Plan
          </h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            Drag products to your timeline to build your race fueling strategy
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetNutrition}
          disabled={resetting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          {resetting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Reset All
        </Button>
      </div>

      <div className="h-[800px] -mx-6 border-t border-brand-navy-200">
        <NutritionPlanner
          key={resetKey}
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
