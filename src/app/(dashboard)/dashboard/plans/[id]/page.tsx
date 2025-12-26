"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Zap,
  Route,
  Utensils,
  Droplets,
  FlaskConical,
  Download,
  Edit,
  Mountain,
  Watch,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { cn, formatDateLong } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  formatDuration,
  calculateAltitudeAdjustedFTP,
  calculateTargetNP,
  calculateRaceNutrition,
} from "@/lib/calculations";
import type { EffortLevel } from "@/types";
import { GarminExportModal } from "@/components/garmin";

interface Segment {
  id: string;
  segment_order: number;
  start_mile: number;
  end_mile: number;
  start_name: string;
  end_name: string;
  target_time_minutes: number;
  effort_level: EffortLevel;
  power_target_low: number;
  power_target_high: number;
  nutrition_notes: string | null;
  hydration_notes: string | null;
}

interface RacePlan {
  id: string;
  goal_time_minutes: number;
  status: string;
  created_at: string;
  race: {
    id: string;
    name: string;
    location: string | null;
  };
  race_distance: {
    id: string;
    name: string | null;
    distance_miles: number;
    date: string | null;
    elevation_gain: number | null;
  } | null;
  segments: Segment[];
}

interface AthleteProfile {
  ftp_watts: number | null;
  weight_kg: number | null;
  altitude_adjustment_factor: number;
  nutrition_cho_per_hour: number;
  hydration_ml_per_hour: number;
  sodium_mg_per_hour: number;
}

export default function PlanDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [plan, setPlan] = useState<RacePlan | null>(null);
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGarminModal, setShowGarminModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchPlan();
    fetchAthleteProfile();
    fetchSubscriptionStatus();
  }, [id]);

  async function fetchPlan() {
    setLoading(true);
    const { data, error } = await supabase
      .from("race_plans")
      .select(`
        id,
        goal_time_minutes,
        status,
        created_at,
        race:races (
          id,
          name,
          location
        ),
        race_distance:race_distances (
          id,
          name,
          distance_miles,
          date,
          elevation_gain
        ),
        segments (
          id,
          segment_order,
          start_mile,
          end_mile,
          start_name,
          end_name,
          target_time_minutes,
          effort_level,
          power_target_low,
          power_target_high,
          nutrition_notes,
          hydration_notes
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching plan:", error);
      toast.error("Failed to load plan");
    } else if (data) {
      // Sort segments by order
      const sortedPlan = {
        ...data,
        segments: (data.segments || []).sort(
          (a: Segment, b: Segment) => a.segment_order - b.segment_order
        ),
      };
      setPlan(sortedPlan as unknown as RacePlan);
    }
    setLoading(false);
  }

  async function fetchAthleteProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("athlete_profiles")
      .select("ftp_watts, weight_kg, altitude_adjustment_factor, nutrition_cho_per_hour, hydration_ml_per_hour, sodium_mg_per_hour")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setAthlete(data);
    }
  }

  async function fetchSubscriptionStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    setIsSubscribed(data?.subscription_status === "active");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-navy-600">Plan not found</p>
        <Link href="/dashboard/plans" className="text-brand-sky-500 hover:underline mt-2 inline-block">
          Back to plans
        </Link>
      </div>
    );
  }

  // Calculate stats
  const ftp = athlete?.ftp_watts || 250;
  const altFactor = athlete?.altitude_adjustment_factor || 0.2;
  const adjustedFTP = calculateAltitudeAdjustedFTP(ftp, altFactor);
  const targetNP = calculateTargetNP(adjustedFTP, "tempo");
  const raceTimeHours = plan.goal_time_minutes / 60;
  const choPerHour = athlete?.nutrition_cho_per_hour || 90;
  const hydrationMlPerHour = athlete?.hydration_ml_per_hour || 750;
  const sodiumMgPerHour = athlete?.sodium_mg_per_hour || 750;
  const nutrition = calculateRaceNutrition(targetNP, raceTimeHours, choPerHour, hydrationMlPerHour, sodiumMgPerHour);
  const totalTime = plan.segments.reduce((sum, seg) => sum + seg.target_time_minutes, 0);
  const distance = plan.race_distance?.distance_miles || 0;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/plans"
        className="inline-flex items-center gap-2 text-sm text-brand-navy-600 hover:text-brand-navy-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Plans
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
            {plan.race.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-brand-navy-600">
            {plan.race.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {plan.race.location}
              </span>
            )}
            {plan.race_distance && (
              <span className="flex items-center gap-1">
                <Route className="h-4 w-4" />
                {plan.race_distance.name
                  ? `${plan.race_distance.name} (${plan.race_distance.distance_miles} mi)`
                  : `${plan.race_distance.distance_miles} mi`}
              </span>
            )}
            {plan.race_distance?.date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateLong(plan.race_distance.date)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGarminModal(true)}>
            <Watch className="h-4 w-4 mr-2" />
            Garmin
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href={`/dashboard/plans/${plan.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-sky-100">
                <Clock className="h-5 w-5 text-brand-sky-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-600">Goal Time</p>
                <p className="text-xl font-bold font-mono text-brand-navy-900">
                  {formatDuration(plan.goal_time_minutes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-600">Target Power</p>
                <p className="text-xl font-bold font-mono text-brand-navy-900">
                  {Math.round(targetNP)}w
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Route className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-600">Distance</p>
                <p className="text-xl font-bold text-brand-navy-900">
                  {distance} mi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Mountain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-600">Elevation</p>
                <p className="text-xl font-bold text-brand-navy-900">
                  {plan.race_distance?.elevation_gain?.toLocaleString() || "—"} ft
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-brand-sky-500" />
            Race Segments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-brand-navy-100">
            {plan.segments.map((segment, index) => (
              <div
                key={segment.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-brand-navy-50"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-brand-navy-100 flex items-center justify-center text-sm font-medium text-brand-navy-600">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-brand-navy-900">
                      {segment.start_name} → {segment.end_name}
                    </p>
                    <p className="text-sm text-brand-navy-500">
                      Mile {segment.start_mile.toFixed(1)} - {segment.end_mile.toFixed(1)} ·{" "}
                      {(segment.end_mile - segment.start_mile).toFixed(1)} mi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded capitalize",
                      segment.effort_level === "safe" && "bg-emerald-100 text-emerald-700",
                      segment.effort_level === "tempo" && "bg-amber-100 text-amber-700",
                      segment.effort_level === "pushing" && "bg-red-100 text-red-700"
                    )}
                  >
                    {segment.effort_level}
                  </span>
                  <div className="text-right">
                    <p className="font-mono font-medium text-brand-navy-900">
                      {formatDuration(segment.target_time_minutes)}
                    </p>
                    <p className="text-xs text-brand-navy-500">
                      {segment.power_target_low}-{segment.power_target_high}w
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-brand-navy-50 border-t border-brand-navy-200 flex justify-between">
            <span className="font-medium text-brand-navy-700">Total</span>
            <span className="font-mono font-bold text-brand-navy-900">
              {formatDuration(totalTime)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-brand-sky-500" />
            Nutrition Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Utensils className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-600">Carbohydrates</p>
                <p className="font-bold text-brand-navy-900">
                  {choPerHour}g/hr
                </p>
                <p className="text-xs text-brand-navy-500">
                  Total: {nutrition.totalCHO}g
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-600">Hydration</p>
                <p className="font-bold text-brand-navy-900">
                  {hydrationMlPerHour}ml/hr
                </p>
                <p className="text-xs text-brand-navy-500">
                  Total: {(nutrition.totalHydration / 1000).toFixed(1)}L
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <FlaskConical className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-600">Sodium</p>
                <p className="font-bold text-brand-navy-900">
                  {sodiumMgPerHour}mg/hr
                </p>
                <p className="text-xs text-brand-navy-500">
                  Total: {(nutrition.totalSodium / 1000).toFixed(1)}g
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-brand-navy-50 rounded-lg">
            <p className="text-sm text-brand-navy-600">
              <span className="font-medium text-brand-navy-700">Energy Expenditure:</span>{" "}
              {nutrition.totalCalories.toLocaleString()} calories ({Math.round(nutrition.totalCalories / raceTimeHours)}/hr)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Garmin Export Modal */}
      <GarminExportModal
        open={showGarminModal}
        onClose={() => setShowGarminModal(false)}
        racePlanId={plan.id}
        isSubscribed={isSubscribed}
      />
    </div>
  );
}
