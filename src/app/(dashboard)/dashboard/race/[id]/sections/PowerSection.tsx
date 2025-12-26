"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Zap, Mountain, Minus, Lock, Pencil, Check, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUnits } from "@/hooks";
import {
  calculateAllPowerTargets,
  calculateRequiredPowerAdvanced,
  estimateFinishTimeAdvanced,
  DEFAULT_INTENSITY_FACTORS,
  RACE_TYPE_LABELS,
} from "@/lib/calculations/power";
import type { IntensityFactors, RaceType } from "@/types";

interface SurfaceComposition {
  // With _pct suffix (legacy)
  gravel_pct?: number;
  pavement_pct?: number;
  singletrack_pct?: number;
  dirt_pct?: number;
  // Without suffix (current admin format)
  gravel?: number;
  pavement?: number;
  singletrack?: number;
  dirt?: number;
  doubletrack?: number;
}

interface RacePlan {
  id: string;
  goal_time_minutes: number | null;
  goal_np_watts: number | null; // Manual override for Goal NP
  race_distance: {
    distance_miles: number;
    elevation_gain: number | null;
    elevation_high: number | null;
    surface_composition: SurfaceComposition | null;
    // Course profile from GPX analysis
    climbing_pct: number | null;
    flat_pct: number | null;
    descent_pct: number | null;
    avg_climb_grade: number | null;
    avg_descent_grade: number | null;
    // Race type for power adjustment
    race_type: RaceType | null;
  };
}

interface AthleteProfile {
  ftp_watts: number | null;
  weight_kg: number | null;
  gear_weight_kg: number | null; // bike + hydration + gear
  altitude_adjustment_factor: number | null;
  if_safe: number | null;
  if_tempo: number | null;
  if_pushing: number | null;
  power_settings_locked: boolean;
}

interface PowerSectionProps {
  plan: RacePlan;
}

export function PowerSection({ plan }: PowerSectionProps) {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pacingTotalMinutes, setPacingTotalMinutes] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({
    if_safe: 0.67,
    if_tempo: 0.70,
    if_pushing: 0.73,
    altitude_adjustment_factor: 0.20,
  });
  // Goal NP editing state
  const [goalNpWatts, setGoalNpWatts] = useState<number | null>(plan.goal_np_watts);
  const [editingGoalNp, setEditingGoalNp] = useState(false);
  const [goalNpInput, setGoalNpInput] = useState<string>(plan.goal_np_watts?.toString() || "");
  const [savingGoalNp, setSavingGoalNp] = useState(false);

  const supabase = createClient();
  const { units } = useUnits();

  useEffect(() => {
    fetchData();
  }, [plan.id]);

  useEffect(() => {
    if (profile) {
      setEditValues({
        if_safe: profile.if_safe ?? DEFAULT_INTENSITY_FACTORS.safe,
        if_tempo: profile.if_tempo ?? DEFAULT_INTENSITY_FACTORS.tempo,
        if_pushing: profile.if_pushing ?? DEFAULT_INTENSITY_FACTORS.pushing,
        altitude_adjustment_factor: profile.altitude_adjustment_factor ?? 0.20,
      });
    }
  }, [profile]);

  async function fetchData() {
    setLoading(true);

    // Run all queries in parallel for better performance
    const [userResult, segmentsResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("segments")
        .select("target_time_minutes")
        .eq("race_plan_id", plan.id),
    ]);

    // Process segments result
    if (segmentsResult.data && segmentsResult.data.length > 0) {
      const total = segmentsResult.data.reduce((sum, s) => sum + (s.target_time_minutes || 0), 0);
      setPacingTotalMinutes(total);
    }

    // If we have a user, fetch their profile
    const user = userResult.data?.user;
    if (user) {
      const { data } = await supabase
        .from("athlete_profiles")
        .select("ftp_watts, weight_kg, gear_weight_kg, altitude_adjustment_factor, if_safe, if_tempo, if_pushing, power_settings_locked")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    }

    setLoading(false);
  }

  const handleSaveGoalNp = useCallback(async () => {
    setSavingGoalNp(true);
    const npValue = goalNpInput ? parseInt(goalNpInput) : null;

    const { error } = await supabase
      .from("race_plans")
      .update({ goal_np_watts: npValue })
      .eq("id", plan.id);

    if (!error) {
      setGoalNpWatts(npValue);
      setEditingGoalNp(false);
    }
    setSavingGoalNp(false);
  }, [goalNpInput, plan.id, supabase]);

  const handleCancelGoalNp = useCallback(() => {
    setGoalNpInput(goalNpWatts?.toString() || "");
    setEditingGoalNp(false);
  }, [goalNpWatts]);

  const handleClearGoalNp = useCallback(async () => {
    setSavingGoalNp(true);
    const { error } = await supabase
      .from("race_plans")
      .update({ goal_np_watts: null })
      .eq("id", plan.id);

    if (!error) {
      setGoalNpWatts(null);
      setGoalNpInput("");
      setEditingGoalNp(false);
    }
    setSavingGoalNp(false);
  }, [plan.id, supabase]);

  const handleSave = useCallback(async () => {
    if (!profile) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("athlete_profiles")
      .update({
        if_safe: editValues.if_safe,
        if_tempo: editValues.if_tempo,
        if_pushing: editValues.if_pushing,
        altitude_adjustment_factor: editValues.altitude_adjustment_factor,
      })
      .eq("user_id", user.id);

    if (!error) {
      setProfile({
        ...profile,
        if_safe: editValues.if_safe,
        if_tempo: editValues.if_tempo,
        if_pushing: editValues.if_pushing,
        altitude_adjustment_factor: editValues.altitude_adjustment_factor,
      });
      setEditing(false);
    }
    setSaving(false);
  }, [profile, editValues, supabase]);

  const handleCancel = useCallback(() => {
    if (profile) {
      setEditValues({
        if_safe: profile.if_safe ?? DEFAULT_INTENSITY_FACTORS.safe,
        if_tempo: profile.if_tempo ?? DEFAULT_INTENSITY_FACTORS.tempo,
        if_pushing: profile.if_pushing ?? DEFAULT_INTENSITY_FACTORS.pushing,
        altitude_adjustment_factor: profile.altitude_adjustment_factor ?? 0.20,
      });
    }
    setEditing(false);
  }, [profile]);

  // Calculate altitude factor based on race elevation
  const altitudeFactor = useMemo(() => {
    const raceElevation = plan.race_distance.elevation_high ?? 0;
    const ALTITUDE_THRESHOLD = 4000; // ft
    const FULL_ALTITUDE_THRESHOLD = 8000; // ft

    if (raceElevation < ALTITUDE_THRESHOLD) return 0;

    const userFactor = profile?.altitude_adjustment_factor ?? 0.2;
    const scale = Math.min(1, (raceElevation - ALTITUDE_THRESHOLD) / (FULL_ALTITUDE_THRESHOLD - ALTITUDE_THRESHOLD));
    return userFactor * scale;
  }, [plan.race_distance.elevation_high, profile?.altitude_adjustment_factor]);

  // Get intensity factors from profile or use defaults
  const intensityFactors: IntensityFactors = useMemo(() => ({
    safe: profile?.if_safe ?? 0.67,
    tempo: profile?.if_tempo ?? 0.70,
    pushing: profile?.if_pushing ?? 0.73,
  }), [profile]);

  // Calculate power targets
  const powerTargets = useMemo(() => {
    if (!profile?.ftp_watts) return null;
    return calculateAllPowerTargets(profile.ftp_watts, altitudeFactor, intensityFactors);
  }, [profile?.ftp_watts, altitudeFactor, intensityFactors]);

  // Calculate required power for goal time using advanced model
  const { requiredPower, timeEstimate } = useMemo(() => {
    if (!plan.goal_time_minutes || !profile?.weight_kg) {
      return { requiredPower: null, timeEstimate: null };
    }

    const distanceKm = plan.race_distance.distance_miles * 1.60934;
    const elevationGainM = (plan.race_distance.elevation_gain ?? 0) * 0.3048;
    const avgElevationM = ((plan.race_distance.elevation_high ?? 0) / 2) * 0.3048;

    // Use actual surface composition if available
    const surfaceComposition = plan.race_distance.surface_composition ?? undefined;

    // Use stored course profile from GPX analysis if available
    const rd = plan.race_distance;
    const courseProfile = (rd.climbing_pct !== null && rd.flat_pct !== null && rd.descent_pct !== null)
      ? {
          totalDistanceM: distanceKm * 1000,
          climbingDistanceM: (rd.climbing_pct / 100) * distanceKm * 1000,
          flatDistanceM: (rd.flat_pct / 100) * distanceKm * 1000,
          descentDistanceM: (rd.descent_pct / 100) * distanceKm * 1000,
          climbingPct: rd.climbing_pct,
          flatPct: rd.flat_pct,
          descentPct: rd.descent_pct,
          avgClimbGradePct: rd.avg_climb_grade ?? 5,
          avgDescentGradePct: rd.avg_descent_grade ?? -5,
          totalElevationGainM: elevationGainM,
          totalElevationLossM: elevationGainM, // Assume symmetric if not stored
        }
      : undefined;

    // Use gear weight from profile, default to 12kg (~26lbs) if not set
    const gearWeightKg = profile.gear_weight_kg ?? 12;

    // Get race type for power adjustment (default to gravel)
    const raceType: RaceType = plan.race_distance.race_type ?? "gravel";

    const np = calculateRequiredPowerAdvanced(plan.goal_time_minutes, {
      distanceKm,
      elevationGainM,
      avgElevationM,
      riderWeightKg: profile.weight_kg,
      bikeWeightKg: gearWeightKg,
      surfaceComposition,
      courseProfile,
      includeFatigue: true,
      raceType,
    });

    // Get detailed time breakdown at that power
    const estimate = estimateFinishTimeAdvanced({
      distanceKm,
      elevationGainM,
      avgElevationM,
      normalizedPowerWatts: np,
      riderWeightKg: profile.weight_kg,
      bikeWeightKg: gearWeightKg,
      surfaceComposition,
      courseProfile,
      includeFatigue: true,
      raceType,
    });

    return { requiredPower: np, timeEstimate: estimate };
  }, [plan.goal_time_minutes, plan.race_distance, profile?.weight_kg, profile?.gear_weight_kg]);

  // Format time in hours:minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

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

  const needsAltitudeAdjustment = altitudeFactor > 0;
  const raceElevation = plan.race_distance.elevation_high ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">Power Targets</h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            {needsAltitudeAdjustment
              ? `NP zones adjusted for altitude (${raceElevation.toLocaleString()} ft)`
              : "Normalized Power (NP) zones for this course"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile.power_settings_locked ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-full text-amber-700 text-sm font-medium">
              <Lock className="h-3.5 w-3.5" />
              Coach Locked
            </div>
          ) : editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy-100 rounded-lg text-brand-navy-700 text-sm font-medium hover:bg-brand-navy-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-sky-500 rounded-lg text-white text-sm font-medium hover:bg-brand-sky-600 transition-colors disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy-100 rounded-lg text-brand-navy-700 text-sm font-medium hover:bg-brand-navy-200 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit IF & AA%
            </button>
          )}
        </div>
      </div>

      {/* Editing Section - IF and AA% */}
      {editing && (
        <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-200">
          <h4 className="text-sm font-medium text-brand-navy-900 mb-4">Edit Power Settings</h4>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-brand-navy-600 mb-1">
                Altitude Adjustment (AA%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={Math.round(editValues.altitude_adjustment_factor * 100)}
                  onChange={(e) => setEditValues({ ...editValues, altitude_adjustment_factor: parseFloat(e.target.value) / 100 })}
                  className="w-20 px-3 py-2 rounded-lg border border-brand-navy-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-sky-400"
                />
                <span className="text-sm text-brand-navy-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-emerald-700 mb-1">
                IF Safe
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="80"
                  step="1"
                  value={Math.round(editValues.if_safe * 100)}
                  onChange={(e) => setEditValues({ ...editValues, if_safe: parseFloat(e.target.value) / 100 })}
                  className="w-20 px-3 py-2 rounded-lg border border-brand-navy-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-sky-400"
                />
                <span className="text-sm text-brand-navy-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-amber-700 mb-1">
                IF Tempo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="55"
                  max="85"
                  step="1"
                  value={Math.round(editValues.if_tempo * 100)}
                  onChange={(e) => setEditValues({ ...editValues, if_tempo: parseFloat(e.target.value) / 100 })}
                  className="w-20 px-3 py-2 rounded-lg border border-brand-navy-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-sky-400"
                />
                <span className="text-sm text-brand-navy-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-red-700 mb-1">
                IF Pushing
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="60"
                  max="90"
                  step="1"
                  value={Math.round(editValues.if_pushing * 100)}
                  onChange={(e) => setEditValues({ ...editValues, if_pushing: parseFloat(e.target.value) / 100 })}
                  className="w-20 px-3 py-2 rounded-lg border border-brand-navy-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-sky-400"
                />
                <span className="text-sm text-brand-navy-500">%</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-brand-navy-500 flex items-center gap-1">
            <Info className="h-3 w-3" />
            IF = Intensity Factor (% of FTP). NP = IF × Adjusted FTP.
          </p>
        </div>
      )}

      {/* FTP Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="p-4 rounded-lg bg-brand-navy-50">
          <p className="text-sm text-brand-navy-600">Your FTP</p>
          <p className="text-2xl font-bold text-brand-navy-900 font-mono">
            {profile.ftp_watts}w
          </p>
          {profile.weight_kg && (
            <p className="text-xs text-brand-navy-500 mt-1">
              {(profile.ftp_watts / profile.weight_kg).toFixed(2)} W/kg
            </p>
          )}
        </div>
        <div className={cn(
          "p-4 rounded-lg",
          needsAltitudeAdjustment ? "bg-brand-sky-50" : "bg-emerald-50"
        )}>
          <p className="text-sm text-brand-navy-600">
            {needsAltitudeAdjustment ? "AA FTP" : "Race FTP"}
          </p>
          <p className="text-2xl font-bold text-brand-navy-900 font-mono">
            {powerTargets?.adjustedFtp}w
          </p>
          {needsAltitudeAdjustment ? (
            <p className="text-xs text-brand-navy-500 mt-1">
              AA: -{Math.round(altitudeFactor * 100)}%
            </p>
          ) : (
            <p className="text-xs text-emerald-600 mt-1">
              No AA needed
            </p>
          )}
        </div>
        {pacingTotalMinutes && pacingTotalMinutes > 0 && (
          <div className="p-4 rounded-lg bg-amber-50">
            <p className="text-sm text-brand-navy-600">Pacing Total</p>
            <p className="text-2xl font-bold text-amber-700 font-mono">
              {formatTime(pacingTotalMinutes)}
            </p>
            <p className="text-xs text-brand-navy-500 mt-1">
              From segment plan
            </p>
          </div>
        )}
        {/* Goal NP Card - Editable */}
        {plan.goal_time_minutes && powerTargets && (
          <div className={cn(
            "p-4 rounded-lg relative",
            goalNpWatts
              ? "bg-brand-sky-50 border-2 border-brand-sky-300"
              : requiredPower && requiredPower > powerTargets.adjustedNP.pushing
                ? "bg-red-50 border border-red-200"
                : requiredPower && requiredPower > powerTargets.adjustedNP.tempo
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-emerald-50"
          )}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-brand-navy-600">
                Goal NP {goalNpWatts && <span className="text-brand-sky-600">(Set)</span>}
              </p>
              {!editingGoalNp && (
                <button
                  onClick={() => {
                    setGoalNpInput(goalNpWatts?.toString() || requiredPower?.toString() || "");
                    setEditingGoalNp(true);
                  }}
                  className="p-1 text-brand-navy-400 hover:text-brand-sky-600 hover:bg-brand-sky-50 rounded transition-colors"
                  title="Edit Goal NP"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {editingGoalNp ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={goalNpInput}
                    onChange={(e) => setGoalNpInput(e.target.value)}
                    className="w-24 px-2 py-1 text-lg font-bold font-mono border border-brand-navy-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-sky-400"
                    placeholder={requiredPower?.toString() || ""}
                    autoFocus
                  />
                  <span className="text-lg font-bold text-brand-navy-600">w</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveGoalNp}
                    disabled={savingGoalNp}
                    className="p-1.5 bg-brand-sky-500 text-white rounded hover:bg-brand-sky-600 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelGoalNp}
                    className="p-1.5 text-brand-navy-500 hover:text-brand-navy-700 hover:bg-brand-navy-100 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {goalNpWatts && (
                    <button
                      onClick={handleClearGoalNp}
                      disabled={savingGoalNp}
                      className="text-xs text-red-500 hover:text-red-700 ml-auto"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {requiredPower && (
                  <p className="text-xs text-brand-navy-400">
                    Calculated: {requiredPower}w
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className={cn(
                  "text-2xl font-bold font-mono",
                  goalNpWatts
                    ? "text-brand-sky-700"
                    : requiredPower && requiredPower > powerTargets.adjustedNP.pushing
                      ? "text-red-700"
                      : requiredPower && requiredPower > powerTargets.adjustedNP.tempo
                        ? "text-amber-700"
                        : "text-emerald-700"
                )}>
                  {goalNpWatts || requiredPower || "—"}w
                </p>
                <p className="text-xs text-brand-navy-500 mt-1">
                  {goalNpWatts ? (
                    <>
                      Coach/manual target
                      {requiredPower && (
                        <span className="ml-1 text-brand-navy-400">
                          (calc: {requiredPower}w)
                        </span>
                      )}
                    </>
                  ) : requiredPower && requiredPower > powerTargets.adjustedNP.pushing
                    ? "Exceeds Pushing zone"
                    : requiredPower && requiredPower > powerTargets.adjustedNP.tempo
                      ? "Requires Pushing effort"
                      : "Within Tempo zone"
                  }
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Advanced Time Estimate Breakdown */}
      {timeEstimate && plan.goal_time_minutes && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-brand-navy-50 to-brand-sky-50 border border-brand-navy-100">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-brand-sky-600" />
            <h4 className="text-sm font-medium text-brand-navy-900">
              Physics-Based Time Breakdown
            </h4>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Surface Composition */}
            <div>
              <p className="text-xs text-brand-navy-500 mb-1">Surface Mix</p>
              {plan.race_distance.surface_composition ? (
                (() => {
                  const sc = plan.race_distance.surface_composition;
                  const gravelPct = sc.gravel_pct ?? sc.gravel ?? 0;
                  const pavementPct = sc.pavement_pct ?? sc.pavement ?? 0;
                  const dirtPct = sc.dirt_pct ?? sc.dirt ?? 0;
                  const singletrackPct = sc.singletrack_pct ?? sc.singletrack ?? 0;
                  const doubletrackPct = sc.doubletrack ?? 0;
                  return (
                    <div className="text-xs font-mono space-y-0.5">
                      {gravelPct > 0 && (
                        <div className="flex justify-between">
                          <span className="text-amber-600">Gravel:</span>
                          <span>{gravelPct}%</span>
                        </div>
                      )}
                      {pavementPct > 0 && (
                        <div className="flex justify-between">
                          <span className="text-brand-navy-600">Pavement:</span>
                          <span>{pavementPct}%</span>
                        </div>
                      )}
                      {dirtPct > 0 && (
                        <div className="flex justify-between">
                          <span className="text-orange-600">Dirt:</span>
                          <span>{dirtPct}%</span>
                        </div>
                      )}
                      {doubletrackPct > 0 && (
                        <div className="flex justify-between">
                          <span className="text-yellow-700">Doubletrack:</span>
                          <span>{doubletrackPct}%</span>
                        </div>
                      )}
                      {singletrackPct > 0 && (
                        <div className="flex justify-between">
                          <span className="text-emerald-600">Singletrack:</span>
                          <span>{singletrackPct}%</span>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <p className="text-xs text-brand-navy-400">Default gravel</p>
              )}
              <p className="text-xs text-brand-navy-400 mt-1">
                Crr: {timeEstimate.effectiveCrr.toFixed(4)}
              </p>
            </div>
            {/* Course Profile */}
            <div>
              <p className="text-xs text-brand-navy-500 mb-1">Course Profile</p>
              <div className="flex gap-1 text-xs font-mono">
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                  ↑{Math.round(timeEstimate.courseProfile.climbingPct)}%
                </span>
                <span className="px-1.5 py-0.5 bg-brand-navy-100 text-brand-navy-700 rounded">
                  →{Math.round(timeEstimate.courseProfile.flatPct)}%
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                  ↓{Math.round(timeEstimate.courseProfile.descentPct)}%
                </span>
              </div>
            </div>
            {/* Time by Terrain */}
            <div>
              <p className="text-xs text-brand-navy-500 mb-1">Time by Terrain</p>
              <div className="text-xs font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-red-600">Climbing:</span>
                  <span>{formatTime(timeEstimate.climbingTimeMinutes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-navy-600">Flat:</span>
                  <span>{formatTime(timeEstimate.flatTimeMinutes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Descent:</span>
                  <span>{formatTime(timeEstimate.descentTimeMinutes)}</span>
                </div>
              </div>
            </div>
            {/* Fatigue Factor */}
            <div>
              <p className="text-xs text-brand-navy-500 mb-1">Fatigue Factor</p>
              <p className={cn(
                "text-lg font-bold font-mono",
                timeEstimate.fatigueFactor < 0.90 ? "text-red-600" :
                timeEstimate.fatigueFactor < 0.95 ? "text-amber-600" :
                "text-emerald-600"
              )}>
                {Math.round(timeEstimate.fatigueFactor * 100)}%
              </p>
              <p className="text-xs text-brand-navy-400">
                {timeEstimate.fatigueFactor < 0.90 ? "Significant fatigue" :
                 timeEstimate.fatigueFactor < 0.95 ? "Moderate fatigue" :
                 "Minimal fatigue"}
              </p>
            </div>
            {/* Avg Speed */}
            <div>
              <p className="text-xs text-brand-navy-500 mb-1">Avg Speed</p>
              <p className="text-lg font-bold font-mono text-brand-navy-900">
                {units === "metric"
                  ? `${timeEstimate.avgSpeedKph.toFixed(1)} km/h`
                  : `${(timeEstimate.avgSpeedKph * 0.621371).toFixed(1)} mph`}
              </p>
              <p className="text-xs text-brand-navy-400">
                {units === "metric"
                  ? `${(timeEstimate.avgSpeedKph * 0.621371).toFixed(1)} mph`
                  : `${timeEstimate.avgSpeedKph.toFixed(1)} km/h`}
              </p>
            </div>
          </div>

          {/* Race Type Adjustment Row */}
          <div className="mt-4 pt-3 border-t border-brand-navy-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-brand-navy-500 mb-0.5">Race Type</p>
                <p className="text-sm font-medium text-brand-navy-900">
                  {RACE_TYPE_LABELS[timeEstimate.raceType]}
                </p>
              </div>
              <div className="h-8 w-px bg-brand-navy-200" />
              <div>
                <p className="text-xs text-brand-navy-500 mb-0.5">Real-World Factor</p>
                <p className={cn(
                  "text-sm font-bold font-mono",
                  timeEstimate.raceTypeMultiplier < 0.95 ? "text-amber-600" : "text-brand-navy-900"
                )}>
                  {Math.round(timeEstimate.raceTypeMultiplier * 100)}%
                </p>
              </div>
              <div className="h-8 w-px bg-brand-navy-200" />
              <div>
                <p className="text-xs text-brand-navy-500 mb-0.5">Adjusted NP</p>
                <p className="text-sm font-bold font-mono text-brand-sky-600">
                  {Math.round(timeEstimate.adjustedNP)}w
                </p>
              </div>
            </div>
            <p className="text-xs text-brand-navy-400 max-w-md">
              {timeEstimate.raceType === "road" && "Heavy drafting in road peloton reduces sustained power needs"}
              {timeEstimate.raceType === "gravel" && "Some drafting on fast sections, occasional coasting on descents"}
              {timeEstimate.raceType === "xc_mtb" && "Minimal drafting, some hike-a-bike, technical terrain reduces power output"}
              {timeEstimate.raceType === "ultra_mtb" && "Significant hike-a-bike sections, conservation pacing, extended coasting"}
            </p>
          </div>

          <p className="mt-3 text-xs text-brand-navy-400">
            Includes {formatTime(timeEstimate.overheadMinutes)} overhead for stops, nutrition, and mechanicals.
          </p>
        </div>
      )}

      {/* Target NP Table */}
      {powerTargets && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-navy-100">
                <th className="text-left py-2 pr-4 font-medium text-brand-navy-600">Target NP</th>
                <th className="text-center py-2 px-4 font-medium text-emerald-700">
                  <div>Safe</div>
                  <div className="text-xs font-normal">IF {Math.round(intensityFactors.safe * 100)}%</div>
                </th>
                <th className="text-center py-2 px-4 font-medium text-amber-700">
                  <div>Tempo</div>
                  <div className="text-xs font-normal">IF {Math.round(intensityFactors.tempo * 100)}%</div>
                </th>
                <th className="text-center py-2 px-4 font-medium text-red-700">
                  <div>Pushing</div>
                  <div className="text-xs font-normal">IF {Math.round(intensityFactors.pushing * 100)}%</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-brand-navy-50">
                <td className="py-3 pr-4 text-brand-navy-700">Sea Level NP</td>
                <td className="py-3 px-4 text-center font-mono">{powerTargets.seaLevelNP.safe}w</td>
                <td className="py-3 px-4 text-center font-mono">{powerTargets.seaLevelNP.tempo}w</td>
                <td className="py-3 px-4 text-center font-mono">{powerTargets.seaLevelNP.pushing}w</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-brand-navy-700">
                  Race NP
                  {needsAltitudeAdjustment && (
                    <span className="text-brand-navy-400 ml-1">(AA -{Math.round(altitudeFactor * 100)}%)</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">{powerTargets.adjustedNP.safe}w</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">{powerTargets.adjustedNP.tempo}w</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-red-700">{powerTargets.adjustedNP.pushing}w</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Terrain Pacing Table */}
      {powerTargets && (
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
                <td className="py-3 pr-4 text-brand-navy-700 flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-brand-navy-400" />
                  Climbing <span className="text-brand-navy-400">(+20% NP)</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-emerald-100 text-emerald-800">
                    {powerTargets.climbingPower.safe}w
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-amber-100 text-amber-800">
                    {powerTargets.climbingPower.tempo}w
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-red-100 text-red-800">
                    {powerTargets.climbingPower.pushing}w
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-brand-navy-700 flex items-center gap-2">
                  <Minus className="h-4 w-4 text-brand-navy-400" />
                  Flat/Rolling <span className="text-brand-navy-400">(-10% NP)</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-emerald-100 text-emerald-800">
                    {powerTargets.flatPower.safe}w
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-amber-100 text-amber-800">
                    {powerTargets.flatPower.tempo}w
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-red-100 text-red-800">
                    {powerTargets.flatPower.pushing}w
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Explanation */}
      <div className="p-4 rounded-lg bg-brand-navy-50 text-sm text-brand-navy-600">
        <p className="font-medium text-brand-navy-900 mb-2">Power Zone Guidance</p>
        <ul className="space-y-1">
          <li><span className="text-emerald-700 font-medium">Safe (IF {Math.round(intensityFactors.safe * 100)}%):</span> Conservative NP, preserving energy for later</li>
          <li><span className="text-amber-700 font-medium">Tempo (IF {Math.round(intensityFactors.tempo * 100)}%):</span> Sustainable race NP, primary target zone</li>
          <li><span className="text-red-700 font-medium">Pushing (IF {Math.round(intensityFactors.pushing * 100)}%):</span> Maximum sustainable NP, use sparingly</li>
        </ul>
        <p className="mt-3 text-xs text-brand-navy-500">
          <strong>IF</strong> = Intensity Factor (% of FTP). <strong>NP</strong> = Normalized Power (weighted average accounting for power variability).
        </p>
      </div>
    </div>
  );
}
