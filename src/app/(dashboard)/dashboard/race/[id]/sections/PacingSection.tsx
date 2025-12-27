"use client";

import { useState, useEffect } from "react";
import {
  Timer,
  Loader2,
  Mountain,
  Flag,
  Sparkles,
  Clock,
  Gauge,
  BarChart3,
  List,
} from "lucide-react";
import { Button, ViewToggle, type ViewMode } from "@/components/ui";
import { cn, haversineDistance } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUnits } from "@/hooks";
import { usePremiumFeature } from "@/hooks/useSubscription";
import { toast } from "sonner";
import {
  formatDuration,
  calculateArrivalTime,
  generateSegmentsFromAidStations,
} from "@/lib/calculations";
import type { ElevationPoint } from "@/lib/calculations";
import { ElevationPlanner } from "@/components/elevation-planner";
import { TopTubeStickerButton } from "@/components/exports";
import { SplitsPreview } from "@/components/premium-previews";
import { SegmentRow, EFFORT_CONFIG, type SegmentData, type AidStation } from "@/components/pacing";

interface Segment {
  id: string;
  segment_order: number;
  start_mile: number;
  end_mile: number;
  start_name: string | null;
  end_name: string | null;
  target_time_minutes: number;
  effort_level: string;
  elevation_gain: number | null;
  elevation_loss: number | null;
  avg_gradient: number | null;
}

interface RacePlan {
  id: string;
  goal_time_minutes: number | null;
  start_time: string | null;
  race_distance: {
    id: string;
    distance_miles: number;
    gpx_distance_miles: number | null;
    gpx_file_url: string | null;
    start_time: string | null;
    date: string | null;
    aid_stations: AidStation[] | null;
    race_edition?: {
      race?: {
        name: string;
      };
    };
  };
  segments: Segment[];
}

// Parse GPX to extract elevation points
async function fetchElevationPoints(gpxUrl: string): Promise<ElevationPoint[]> {
  const response = await fetch(gpxUrl);
  if (!response.ok) throw new Error("Failed to fetch GPX");

  const gpxText = await response.text();
  const parser = new DOMParser();
  const gpxDoc = parser.parseFromString(gpxText, "text/xml");
  const trackPoints = gpxDoc.querySelectorAll("trkpt");

  const points: ElevationPoint[] = [];
  let totalDistance = 0;
  let prevLat: number | null = null;
  let prevLon: number | null = null;

  trackPoints.forEach((point) => {
    const lat = parseFloat(point.getAttribute("lat") || "0");
    const lon = parseFloat(point.getAttribute("lon") || "0");
    const eleElement = point.querySelector("ele");
    const elevation = eleElement ? parseFloat(eleElement.textContent || "0") : 0;
    const elevationFt = elevation * 3.28084;

    if (prevLat !== null && prevLon !== null) {
      const distanceKm = haversineDistance(prevLat, prevLon, lat, lon);
      totalDistance += distanceKm * 0.621371;
    }

    const lastPoint = points[points.length - 1];
    if (points.length === 0 || (lastPoint && totalDistance - lastPoint.mile >= 0.1)) {
      points.push({
        mile: Math.round(totalDistance * 10) / 10,
        elevation: Math.round(elevationFt),
      });
    }

    prevLat = lat;
    prevLon = lon;
  });

  return points;
}

interface PacingSectionProps {
  plan: RacePlan;
  onUpdate: () => void;
}

// View toggle options
const VIEW_OPTIONS = [
  { value: "table" as ViewMode, icon: <List className="h-4 w-4" />, label: "Table" },
  { value: "visual" as ViewMode, icon: <BarChart3 className="h-4 w-4" />, label: "Visual" },
];

export function PacingSection({ plan, onUpdate }: PacingSectionProps) {
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewModeState] = useState<ViewMode>("table");
  const supabase = createClient();
  const { units } = useUnits();
  const { canAccess: isPremium, isLoading: isPremiumLoading } = usePremiumFeature("Race Splits");

  // Persist view mode in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pacing-view-mode");
    if (saved === "visual" || saved === "table") {
      setViewModeState(saved);
    }
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem("pacing-view-mode", mode);
  };

  const effectiveDistance = plan.race_distance.gpx_distance_miles ?? plan.race_distance.distance_miles;
  const allStations = plan.race_distance.aid_stations ?? [];
  const segments = [...plan.segments].sort((a, b) => a.segment_order - b.segment_order);
  const startTime = plan.start_time?.slice(0, 5) || plan.race_distance.start_time?.slice(0, 5) || "06:00";

  // Calculate cumulative times
  let elapsedMinutes = 0;
  const segmentsWithTiming: SegmentData[] = segments.map((segment) => {
    const arrivalTime = calculateArrivalTime(startTime, elapsedMinutes + segment.target_time_minutes);
    elapsedMinutes += segment.target_time_minutes;
    return { ...segment, arrivalTime, elapsedMinutes };
  });

  const totalTime = segments.reduce((sum, s) => sum + s.target_time_minutes, 0);
  const totalElevationGain = segments.reduce((sum, s) => sum + (s.elevation_gain || 0), 0);
  const totalElevationLoss = segments.reduce((sum, s) => sum + (s.elevation_loss || 0), 0);
  const avgPacePerMile = effectiveDistance > 0 ? totalTime / effectiveDistance : 0;

  const handleGenerateFromAidStations = async () => {
    if (allStations.length === 0) {
      toast.error("No aid stations or checkpoints found for this race");
      return;
    }
    if (!plan.goal_time_minutes) {
      toast.error("Please set a goal time first");
      return;
    }

    setGenerating(true);
    try {
      let elevationPoints: ElevationPoint[] | undefined;
      if (plan.race_distance.gpx_file_url) {
        try {
          elevationPoints = await fetchElevationPoints(plan.race_distance.gpx_file_url);
        } catch (err) {
          console.warn("Could not fetch elevation data:", err);
        }
      }

      if (segments.length > 0) {
        await supabase.from("segments").delete().eq("race_plan_id", plan.id);
      }

      const newSegments = generateSegmentsFromAidStations(
        allStations,
        effectiveDistance,
        plan.goal_time_minutes,
        elevationPoints
      );

      const segmentsToInsert = newSegments.map((seg, index) => ({
        race_plan_id: plan.id,
        segment_order: index,
        start_mile: seg.startMile,
        end_mile: seg.endMile,
        start_name: seg.startName,
        end_name: seg.endName,
        target_time_minutes: Math.round(seg.targetTimeMinutes),
        effort_level: seg.effortLevel,
        elevation_gain: seg.elevationGain ?? null,
        elevation_loss: seg.elevationLoss ?? null,
        avg_gradient: seg.avgGradient ?? null,
      }));

      const { error } = await supabase.from("segments").insert(segmentsToInsert);
      if (error) throw error;

      toast.success("Race splits generated with terrain-adjusted times");
      onUpdate();
    } catch (error) {
      console.error("Error generating segments:", error);
      toast.error("Failed to generate splits");
    }
    setGenerating(false);
  };

  const handleUpdateSegment = async (segmentId: string, updates: Partial<Segment>) => {
    const { error } = await supabase.from("segments").update(updates).eq("id", segmentId);
    if (error) {
      toast.error("Failed to update split");
    } else {
      onUpdate();
    }
  };

  const handleTimeChange = async (segmentId: string, newTimeMinutes: number) => {
    const segment = segments.find((s) => s.id === segmentId);
    if (!segment || newTimeMinutes === segment.target_time_minutes) return;

    const timeDiff = newTimeMinutes - segment.target_time_minutes;
    const { error } = await supabase
      .from("segments")
      .update({ target_time_minutes: newTimeMinutes })
      .eq("id", segmentId);

    if (error) {
      toast.error("Failed to update split time");
    } else {
      const action = timeDiff > 0 ? "added" : "saved";
      toast.success(`Split time updated: ${Math.abs(timeDiff)} min ${action}`);
      onUpdate();
    }
  };

  const handleEffortChange = async (segment: SegmentData, newEffort: string) => {
    const oldIF = EFFORT_CONFIG[segment.effort_level as keyof typeof EFFORT_CONFIG]?.intensityFactor || 0.70;
    const newIF = EFFORT_CONFIG[newEffort as keyof typeof EFFORT_CONFIG]?.intensityFactor || 0.70;

    if (oldIF === newIF) {
      return handleUpdateSegment(segment.id, { effort_level: newEffort });
    }

    let exponent = 1 / 3;
    if (segment.avg_gradient != null) {
      if (segment.avg_gradient > 3) {
        exponent = 1;
      } else if (segment.avg_gradient < -3) {
        exponent = 0.2;
      } else {
        exponent = 1 / 3 + (segment.avg_gradient / 10) * (2 / 3);
      }
    }

    const effectiveExponent = Math.max(exponent, 0.5);
    const timeRatio = Math.pow(oldIF / newIF, effectiveExponent);
    const newTime = Math.round(segment.target_time_minutes * timeRatio);

    await handleUpdateSegment(segment.id, {
      effort_level: newEffort,
      target_time_minutes: newTime,
    });

    const timeDiff = segment.target_time_minutes - newTime;
    if (timeDiff !== 0) {
      toast.success(
        `${timeDiff > 0 ? "Faster" : "Slower"}: ${Math.abs(timeDiff)} min ${timeDiff > 0 ? "saved" : "added"}`
      );
    }
  };

  // Loading state
  if (isPremiumLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 bg-brand-navy-100 rounded" />
        <div className="h-32 bg-brand-navy-100 rounded" />
      </div>
    );
  }

  // Free user preview
  if (!isPremium) {
    return (
      <SplitsPreview
        raceName={plan.race_distance.race_edition?.race?.name}
        distanceMiles={effectiveDistance}
        goalTimeMinutes={plan.goal_time_minutes ?? undefined}
        aidStationCount={allStations.length}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-brand-sky-500 to-brand-sky-600 text-white shadow-lg shadow-brand-sky-500/25">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-brand-navy-900">Race Splits</h3>
            <p className="text-sm text-brand-navy-500">Your segment-by-segment time targets</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle options={VIEW_OPTIONS} value={viewMode} onChange={setViewMode} />
          {segments.length > 0 && (
            <TopTubeStickerButton
              raceName={plan.race_distance.race_edition?.race?.name || "Race"}
              goalTime={plan.goal_time_minutes ? formatDuration(plan.goal_time_minutes) : undefined}
              segments={segments}
              stations={allStations}
              startTime={startTime}
              totalDistance={effectiveDistance}
              totalElevationGain={totalElevationGain}
              gpxFileUrl={plan.race_distance.gpx_file_url}
            />
          )}
          {allStations.length > 0 && (
            <Button
              onClick={handleGenerateFromAidStations}
              disabled={generating}
              className="gap-2 bg-brand-navy-900 hover:bg-brand-navy-800 text-white shadow-lg"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Generating..." : "Auto-Generate Splits"}
            </Button>
          )}
        </div>
      </div>

      {segments.length === 0 ? (
        /* Empty State */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy-50 to-brand-sky-50 border border-brand-navy-100 p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-sky-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative text-center max-w-md mx-auto">
            <div className="inline-flex p-4 rounded-2xl bg-white shadow-lg mb-6">
              <Timer className="h-8 w-8 text-brand-sky-500" />
            </div>
            <h4 className="text-xl font-bold text-brand-navy-900 mb-2">No splits configured yet</h4>
            <p className="text-brand-navy-600 mb-6">
              Generate race splits based on aid station locations and your goal time.
              Times are automatically adjusted for terrain difficulty.
            </p>
            {allStations.length > 0 ? (
              <Button
                onClick={handleGenerateFromAidStations}
                disabled={generating}
                size="lg"
                className="gap-2 bg-brand-navy-900 hover:bg-brand-navy-800"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Race Splits
              </Button>
            ) : (
              <p className="text-sm text-brand-navy-500 bg-white/80 rounded-lg px-4 py-3">
                This race doesn&apos;t have aid station data configured yet
              </p>
            )}
          </div>
        </div>
      ) : viewMode === "visual" ? (
        /* Visual Planner View */
        <ElevationPlanner
          gpxUrl={plan.race_distance.gpx_file_url}
          segments={segments.map((s) => ({
            id: s.id,
            race_plan_id: plan.id,
            segment_order: s.segment_order,
            start_mile: s.start_mile,
            end_mile: s.end_mile,
            start_name: s.start_name || `Mile ${s.start_mile}`,
            end_name: s.end_name || `Mile ${s.end_mile}`,
            target_time_minutes: s.target_time_minutes,
            effort_level: s.effort_level as "safe" | "tempo" | "pushing",
            power_target_low: 0,
            power_target_high: 0,
            nutrition_notes: null,
            hydration_notes: null,
            terrain_notes: null,
            strategy_notes: null,
          }))}
          aidStations={(plan.race_distance.aid_stations ?? []).map((s) => ({
            name: s.name,
            mile: s.mile,
            supplies: [],
            cutoff_time: null,
            type: s.type || "aid_station",
          }))}
          racePlanId={plan.id}
          raceStartTime={startTime}
          onSegmentUpdate={async (segment) => {
            await handleUpdateSegment(segment.id, {
              effort_level: segment.effort_level,
              target_time_minutes: segment.target_time_minutes,
            });
          }}
        />
      ) : (
        /* Table View */
        <div className="space-y-6">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-brand-navy-100 p-4">
              <div className="flex items-center gap-2 text-brand-navy-500 text-xs font-medium mb-1">
                <Flag className="h-3.5 w-3.5" />
                SPLITS
              </div>
              <p className="text-2xl font-bold text-brand-navy-900">{segments.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-brand-navy-100 p-4">
              <div className="flex items-center gap-2 text-brand-navy-500 text-xs font-medium mb-1">
                <Clock className="h-3.5 w-3.5" />
                TOTAL TIME
              </div>
              <p className="text-2xl font-bold font-mono text-brand-navy-900">{formatDuration(totalTime)}</p>
            </div>
            <div className="bg-white rounded-xl border border-brand-navy-100 p-4">
              <div className="flex items-center gap-2 text-brand-navy-500 text-xs font-medium mb-1">
                <Gauge className="h-3.5 w-3.5" />
                AVG PACE
              </div>
              <p className="text-2xl font-bold font-mono text-brand-navy-900">
                {formatDuration(avgPacePerMile)}<span className="text-sm font-normal text-brand-navy-500">/mi</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border border-brand-navy-100 p-4">
              <div className="flex items-center gap-2 text-brand-navy-500 text-xs font-medium mb-1">
                <Mountain className="h-3.5 w-3.5" />
                ELEVATION
              </div>
              <p className="text-lg font-bold text-brand-navy-900">
                <span className="text-green-600">+{totalElevationGain.toLocaleString()}</span>
                <span className="text-brand-navy-300 mx-1">/</span>
                <span className="text-red-500">-{totalElevationLoss.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Splits Timeline */}
          <div className="relative">
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-brand-sky-400 via-brand-sky-300 to-brand-sky-400 hidden sm:block" />
            <div className="space-y-3">
              {segmentsWithTiming.map((segment, index) => (
                <SegmentRow
                  key={segment.id}
                  segment={segment}
                  index={index}
                  totalSegments={segments.length}
                  effectiveDistance={effectiveDistance}
                  units={units}
                  allStations={allStations}
                  onTimeChange={handleTimeChange}
                  onEffortChange={handleEffortChange}
                />
              ))}
            </div>
          </div>

          {/* Summary Footer */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 p-6">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15h30M15 0v30' stroke='%23ffffff' stroke-opacity='0.1' fill='none'/%3E%3C/svg%3E\")"
              }}
            />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur">
                  <Flag className="h-6 w-6 text-brand-sky-400" />
                </div>
                <div>
                  <p className="text-brand-navy-300 text-sm">Race Finish</p>
                  <p className="text-white text-2xl font-bold font-mono">{formatDuration(totalTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-brand-navy-400 text-xs uppercase tracking-wide">Distance</p>
                  <p className="text-white font-semibold">{effectiveDistance} mi</p>
                </div>
                <div className="text-right">
                  <p className="text-brand-navy-400 text-xs uppercase tracking-wide">Finish Time</p>
                  <p className="text-white font-semibold">
                    {segmentsWithTiming.length > 0 ? segmentsWithTiming[segmentsWithTiming.length - 1]?.arrivalTime : startTime}
                  </p>
                </div>
                {plan.goal_time_minutes && Math.abs(totalTime - plan.goal_time_minutes) > 1 && (
                  <div className={cn(
                    "px-4 py-2 rounded-lg font-semibold",
                    totalTime > plan.goal_time_minutes ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
                  )}>
                    {totalTime > plan.goal_time_minutes ? "+" : "-"}
                    {formatDuration(Math.abs(totalTime - plan.goal_time_minutes))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
