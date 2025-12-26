"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Route,
  Loader2,
  Save,
  Download,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn, formatDateLong } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { usePlanBuilder } from "../context/PlanBuilderContext";
import { usePremiumFeature } from "@/hooks/useSubscription";
import {
  formatDuration,
  calculateAltitudeAdjustedFTP,
  calculateTargetNP,
  calculateRaceNutrition,
} from "@/lib/calculations";

export function ReviewSave() {
  const { state } = usePlanBuilder();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { canAccess: isPremium, showUpgrade } = usePremiumFeature("Save Race Plan");

  const supabase = createClient();

  // Calculate summary stats
  const adjustedFTP = calculateAltitudeAdjustedFTP(
    state.athlete.ftp,
    state.athlete.altitudeAdjustmentFactor
  );
  const targetNP = calculateTargetNP(adjustedFTP, "tempo");
  const raceTimeHours = state.goalTimeMinutes / 60;
  const nutrition = calculateRaceNutrition(
    targetNP,
    raceTimeHours,
    state.nutritionPlan.choPerHour,
    state.nutritionPlan.hydrationMlPerHour,
    state.nutritionPlan.sodiumMgPerHour
  );

  const totalTime = state.segments.reduce(
    (sum, seg) => sum + seg.targetTimeMinutes,
    0
  );

  const handleSave = async () => {
    setSaving(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save your plan");
        setSaving(false);
        return;
      }

      // Get race_id from distance
      const { data: distanceData } = await supabase
        .from("race_distances")
        .select("race_edition:race_editions(race_id)")
        .eq("id", state.distanceId)
        .single();

      const raceEdition = distanceData?.race_edition as unknown as { race_id: string } | null;
      const raceId = raceEdition?.race_id;
      if (!raceId) {
        toast.error("Could not find race information");
        setSaving(false);
        return;
      }

      // Create race plan
      const { data: plan, error: planError } = await supabase
        .from("race_plans")
        .insert({
          user_id: user.id,
          race_id: raceId,
          race_edition_id: state.distance?.race_edition_id,
          race_distance_id: state.distanceId,
          goal_time_minutes: state.goalTimeMinutes,
          created_by: user.id,
          status: "complete",
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create segments
      const segmentsToInsert = state.segments.map((seg, index) => ({
        race_plan_id: plan.id,
        segment_order: index,
        start_mile: seg.startMile,
        end_mile: seg.endMile,
        start_name: seg.startName,
        end_name: seg.endName,
        target_time_minutes: Math.round(seg.targetTimeMinutes),
        effort_level: seg.effortLevel,
        power_target_low: seg.powerTargetLow,
        power_target_high: seg.powerTargetHigh,
        nutrition_notes: seg.nutritionNotes || null,
        hydration_notes: seg.hydrationNotes || null,
        terrain_notes: seg.terrainNotes || null,
        strategy_notes: seg.strategyNotes || null,
      }));

      const { error: segmentsError } = await supabase
        .from("segments")
        .insert(segmentsToInsert);

      if (segmentsError) throw segmentsError;

      toast.success("Plan saved successfully!");
      router.push(`/dashboard/plans/${plan.id}`);
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan. Please try again.");
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">
          Review Your Plan
        </h2>
        <p className="mt-1 text-sm text-brand-navy-600">
          Review your race plan before saving
        </p>
      </div>

      {/* Race Info */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-brand-sky-50 to-brand-navy-50 border border-brand-sky-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-brand-navy-900">
              {state.raceName}
            </h3>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-brand-navy-600">
              {state.raceLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {state.raceLocation}
                </span>
              )}
              {state.distance?.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDateLong(state.distance.date)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Route className="h-4 w-4" />
                {state.distance?.name
                  ? `${state.distance.name} (${state.distance.distance_miles} mi)`
                  : `${state.distance?.distance_miles} mi`}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-brand-navy-600">Goal Time</p>
            <p className="text-2xl font-bold font-mono text-brand-navy-900">
              {formatDuration(state.goalTimeMinutes)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Athlete */}
        <div className="p-4 rounded-lg border border-brand-navy-200 bg-white">
          <h4 className="text-sm font-medium text-brand-navy-600 mb-2">
            Athlete Profile
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-navy-500">FTP:</span>
              <span className="font-medium text-brand-navy-900">
                {state.athlete.ftp}w
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-500">Adjusted FTP:</span>
              <span className="font-medium text-brand-navy-900">
                {Math.round(adjustedFTP)}w
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-500">Weight:</span>
              <span className="font-medium text-brand-navy-900">
                {state.athlete.weightKg} kg
              </span>
            </div>
          </div>
        </div>

        {/* Timing */}
        <div className="p-4 rounded-lg border border-brand-navy-200 bg-white">
          <h4 className="text-sm font-medium text-brand-navy-600 mb-2">
            Timing
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-navy-500">Start:</span>
              <span className="font-medium text-brand-navy-900">
                {state.startTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-500">Segments:</span>
              <span className="font-medium text-brand-navy-900">
                {state.segments.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-500">Segment Total:</span>
              <span className="font-medium text-brand-navy-900">
                {formatDuration(totalTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Power */}
        <div className="p-4 rounded-lg border border-brand-navy-200 bg-white">
          <h4 className="text-sm font-medium text-brand-navy-600 mb-2">
            Power Targets
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-navy-500">Target NP:</span>
              <span className="font-medium text-brand-navy-900">
                {Math.round(targetNP)}w
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-500">Calories:</span>
              <span className="font-medium text-brand-navy-900">
                {nutrition.totalCalories.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Nutrition */}
        <div className="p-4 rounded-lg border border-brand-navy-200 bg-white">
          <h4 className="text-sm font-medium text-brand-navy-600 mb-2">
            Nutrition Plan
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-navy-500">CHO:</span>
              <span className="font-medium text-brand-navy-900">
                {state.nutritionPlan.choPerHour}g/hr
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-500">Hydration:</span>
              <span className="font-medium text-brand-navy-900">
                {state.nutritionPlan.hydrationMlPerHour}ml/hr
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-500">Sodium:</span>
              <span className="font-medium text-brand-navy-900">
                {state.nutritionPlan.sodiumMgPerHour}mg/hr
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segment Preview */}
      <div className="rounded-lg border border-brand-navy-200 overflow-hidden">
        <div className="p-4 bg-brand-navy-50 border-b border-brand-navy-200">
          <h4 className="font-medium text-brand-navy-900">Race Segments</h4>
        </div>
        <div className="divide-y divide-brand-navy-100">
          {state.segments.map((segment, index) => (
            <div
              key={segment.id}
              className="px-4 py-3 flex items-center justify-between hover:bg-brand-navy-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-brand-navy-500">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-brand-navy-900">
                    {segment.startName} → {segment.endName}
                  </p>
                  <p className="text-xs text-brand-navy-500">
                    {(segment.endMile - segment.startMile).toFixed(1)} mi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded capitalize",
                    segment.effortLevel === "safe" && "bg-emerald-100 text-emerald-700",
                    segment.effortLevel === "tempo" && "bg-amber-100 text-amber-700",
                    segment.effortLevel === "pushing" && "bg-red-100 text-red-700"
                  )}
                >
                  {segment.effortLevel}
                </span>
                <span className="text-sm font-mono text-brand-navy-900">
                  {formatDuration(segment.targetTimeMinutes)}
                </span>
                <span className="text-sm text-brand-navy-600">
                  {segment.powerTargetLow}-{segment.powerTargetHigh}w
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-brand-navy-200">
        <Button variant="outline" disabled={saving}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button
          onClick={isPremium ? handleSave : showUpgrade}
          disabled={saving}
          className={!isPremium ? "bg-gradient-to-r from-brand-sky-500 to-brand-sky-600" : ""}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : !isPremium ? (
            <Lock className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isPremium ? "Save Plan" : "Upgrade to Save"}
        </Button>
      </div>
    </div>
  );
}
