"use client";

import { useState } from "react";
import { Plus, Clock, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  formatDuration,
  calculateArrivalTime,
  generateSegmentsFromAidStations,
} from "@/lib/calculations";
import type { ElevationPoint } from "@/lib/calculations";

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
    aid_stations: Array<{ name: string; mile: number; type?: "aid_station" | "checkpoint" }> | null;
  };
  segments: Segment[];
}

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

    // Sample every ~0.1 miles
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

export function PacingSection({ plan, onUpdate }: PacingSectionProps) {
  const [generating, setGenerating] = useState(false);
  const [_saving, setSaving] = useState(false);
  const supabase = createClient();

  // Use _saving to suppress unused variable warning - used for future loading state
  void _saving;

  // Use GPX distance if available, otherwise fall back to nominal distance
  const effectiveDistance = plan.race_distance.gpx_distance_miles ?? plan.race_distance.distance_miles;

  // Filter to only use actual aid stations (not checkpoints) for pacing
  const aidStations = (plan.race_distance.aid_stations ?? []).filter(
    (s) => !s.type || s.type === "aid_station"
  );

  const segments = [...plan.segments].sort((a, b) => a.segment_order - b.segment_order);
  // Use plan's custom start time if set, otherwise fall back to race distance start time
  const startTime = plan.start_time?.slice(0, 5) || plan.race_distance.start_time?.slice(0, 5) || "06:00";

  const handleGenerateFromAidStations = async () => {
    if (aidStations.length === 0) {
      toast.error("No aid stations found for this race");
      return;
    }

    if (!plan.goal_time_minutes) {
      toast.error("Please set a goal time first");
      return;
    }

    setGenerating(true);

    try {
      // Fetch elevation data from GPX if available
      let elevationPoints: ElevationPoint[] | undefined;
      if (plan.race_distance.gpx_file_url) {
        try {
          elevationPoints = await fetchElevationPoints(plan.race_distance.gpx_file_url);
          toast.success("Elevation data loaded - times will be terrain-adjusted");
        } catch (err) {
          console.warn("Could not fetch elevation data:", err);
          toast.info("Generating without elevation data");
        }
      }

      // Delete existing segments
      if (segments.length > 0) {
        await supabase
          .from("segments")
          .delete()
          .eq("race_plan_id", plan.id);
      }

      // Generate new segments with terrain-adjusted times
      const newSegments = generateSegmentsFromAidStations(
        aidStations,
        effectiveDistance,
        plan.goal_time_minutes,
        elevationPoints
      );

      // Insert segments with elevation data
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

      const { error } = await supabase
        .from("segments")
        .insert(segmentsToInsert);

      if (error) throw error;

      toast.success("Segments generated with terrain-adjusted times!");
      onUpdate();
    } catch (error) {
      console.error("Error generating segments:", error);
      toast.error("Failed to generate segments");
    }

    setGenerating(false);
  };

  const handleUpdateSegment = async (segmentId: string, updates: Partial<Segment>) => {
    setSaving(true);
    const { error } = await supabase
      .from("segments")
      .update(updates)
      .eq("id", segmentId);

    if (error) {
      toast.error("Failed to update segment");
    } else {
      onUpdate();
    }
    setSaving(false);
  };

  // Intensity factors for effort levels
  const INTENSITY_FACTORS: Record<string, number> = {
    safe: 0.67,
    tempo: 0.70,
    pushing: 0.73,
  };

  // Calculate time adjustment when changing effort level
  // Physics: Speed ∝ Power^x where x=1 for climbs, x=1/3 for flats
  // Time = Distance/Speed, so Time ∝ 1/Power^x
  const handleEffortChange = async (segment: Segment & { arrivalTime: string; elapsedMinutes: number }, newEffort: string) => {
    const oldIF = INTENSITY_FACTORS[segment.effort_level] || 0.70;
    const newIF = INTENSITY_FACTORS[newEffort] || 0.70;

    if (oldIF === newIF) {
      return handleUpdateSegment(segment.id, { effort_level: newEffort });
    }

    // Determine terrain type from gradient
    // Climbs: power directly affects speed (exponent = 1)
    // Flats: aerodynamic drag dominates (exponent = 1/3)
    // Descents: gravity helps, less power effect (exponent = 0.2)
    let exponent = 1/3; // default for flat/rolling
    if (segment.avg_gradient != null) {
      if (segment.avg_gradient > 3) {
        exponent = 1; // climbing - power directly affects speed
      } else if (segment.avg_gradient < -3) {
        exponent = 0.2; // descending - less power effect
      } else {
        // Mixed terrain - interpolate based on gradient
        exponent = 1/3 + (segment.avg_gradient / 10) * (2/3);
      }
    }

    // Calculate time ratio: Time_new / Time_old = (IF_old / IF_new)^exponent
    // Use a minimum exponent to ensure meaningful time changes
    const effectiveExponent = Math.max(exponent, 0.5);
    const timeRatio = Math.pow(oldIF / newIF, effectiveExponent);
    const newTime = Math.round(segment.target_time_minutes * timeRatio);

    await handleUpdateSegment(segment.id, {
      effort_level: newEffort,
      target_time_minutes: newTime,
    });

    // Determine if going to harder or easier effort
    const goingHarder = newIF > oldIF;

    if (newTime === segment.target_time_minutes) {
      toast.success(`Effort updated to ${newEffort}`);
    } else if (goingHarder) {
      toast.success(`Harder effort: ${formatDuration(segment.target_time_minutes)} → ${formatDuration(newTime)}`);
    } else {
      toast.success(`Easier effort: ${formatDuration(segment.target_time_minutes)} → ${formatDuration(newTime)}`);
    }
  };

  // Calculate cumulative times
  let elapsedMinutes = 0;
  const segmentsWithTiming = segments.map((segment) => {
    const arrivalTime = calculateArrivalTime(startTime, elapsedMinutes + segment.target_time_minutes);
    elapsedMinutes += segment.target_time_minutes;
    return {
      ...segment,
      arrivalTime,
      elapsedMinutes,
    };
  });

  const totalTime = segments.reduce((sum, s) => sum + s.target_time_minutes, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">Pacing Plan</h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            Set target times for each segment of the race
          </p>
        </div>
        {aidStations.length > 0 && (
          <Button
            variant="outline"
            onClick={handleGenerateFromAidStations}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Generate from Aid Stations
          </Button>
        )}
      </div>

      {segments.length === 0 ? (
        <div className="text-center py-12 bg-brand-navy-50 rounded-lg">
          <Clock className="h-8 w-8 text-brand-navy-300 mx-auto mb-3" />
          <p className="text-brand-navy-600 mb-4">No segments yet</p>
          {aidStations.length > 0 ? (
            <Button onClick={handleGenerateFromAidStations} disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate from Aid Stations
            </Button>
          ) : (
            <p className="text-sm text-brand-navy-500">
              This race doesn&apos;t have aid station data yet
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 text-sm font-medium text-brand-navy-600">
            <div className="col-span-3">Segment</div>
            <div className="col-span-1 text-center">Dist</div>
            <div className="col-span-2 text-center">Elevation</div>
            <div className="col-span-2 text-center">Time</div>
            <div className="col-span-2 text-center">Arrival</div>
            <div className="col-span-2 text-center">Effort</div>
          </div>

          {/* Segments */}
          <div className="space-y-2">
            {segmentsWithTiming.map((segment, index) => (
              <div
                key={segment.id}
                className="grid grid-cols-12 gap-2 items-center p-4 rounded-lg border border-brand-navy-200 hover:border-brand-navy-300 transition-colors"
              >
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-navy-100 flex items-center justify-center text-xs font-medium text-brand-navy-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-brand-navy-900 truncate text-sm">
                        {segment.start_name || `Mile ${segment.start_mile}`}
                      </p>
                      <p className="text-xs text-brand-navy-500 truncate">
                        to {segment.end_name || `Mile ${segment.end_mile}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 text-center">
                  <span className="text-sm font-medium text-brand-navy-900">
                    {(segment.end_mile - segment.start_mile).toFixed(1)}
                  </span>
                </div>

                <div className="col-span-2 text-center">
                  {segment.elevation_gain != null ? (
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700">
                        {segment.elevation_gain.toLocaleString()}
                      </span>
                      {segment.elevation_loss != null && segment.elevation_loss > 0 && (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-500 ml-1" />
                          <span className="text-xs font-medium text-red-600">
                            {segment.elevation_loss.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-brand-navy-400">—</span>
                  )}
                </div>

                <div className="col-span-2 text-center">
                  <span className="text-sm font-mono font-medium text-brand-navy-900">
                    {formatDuration(segment.target_time_minutes)}
                  </span>
                </div>

                <div className="col-span-2 text-center">
                  <span className="text-sm font-medium text-brand-navy-900">
                    {segment.arrivalTime}
                  </span>
                </div>

                <div className="col-span-2">
                  <select
                    value={segment.effort_level}
                    onChange={(e) => handleEffortChange(segment, e.target.value)}
                    className={cn(
                      "w-full text-xs font-medium rounded px-2 py-1 border-0 cursor-pointer",
                      segment.effort_level === "safe" && "bg-emerald-100 text-emerald-700",
                      segment.effort_level === "tempo" && "bg-amber-100 text-amber-700",
                      segment.effort_level === "pushing" && "bg-red-100 text-red-700"
                    )}
                  >
                    <option value="safe">Safe</option>
                    <option value="tempo">Tempo</option>
                    <option value="pushing">Pushing</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-brand-navy-50">
            <span className="font-medium text-brand-navy-700">Total</span>
            <div className="flex items-center gap-6">
              <span className="text-sm text-brand-navy-600">
                {effectiveDistance} mi
              </span>
              <span className="font-mono font-bold text-brand-navy-900">
                {formatDuration(totalTime)}
              </span>
              {plan.goal_time_minutes && Math.abs(totalTime - plan.goal_time_minutes) > 1 && (
                <span className={cn(
                  "text-sm font-medium",
                  totalTime > plan.goal_time_minutes ? "text-red-600" : "text-emerald-600"
                )}>
                  {totalTime > plan.goal_time_minutes ? "+" : "-"}
                  {formatDuration(Math.abs(totalTime - plan.goal_time_minutes))} from goal
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
