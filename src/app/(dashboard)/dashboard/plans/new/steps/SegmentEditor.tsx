"use client";

import { useEffect } from "react";
import { Route, Zap, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { usePlanBuilder, type PlanSegment } from "../context/PlanBuilderContext";
import {
  calculatePowerRange,
  calculateSegmentTime,
  calculateRequiredSpeed,
  formatDuration,
} from "@/lib/calculations";
import type { EffortLevel, AidStation } from "@/types";

const EFFORT_LEVELS: { value: EffortLevel; label: string; color: string }[] = [
  { value: "safe", label: "Safe", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "tempo", label: "Tempo", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "pushing", label: "Push", color: "bg-red-100 text-red-700 border-red-300" },
];

export function SegmentEditor() {
  const { state, dispatch } = usePlanBuilder();

  // Generate segments from checkpoints on first load
  useEffect(() => {
    if (state.segments.length === 0 && state.distance && state.goalTimeMinutes > 0) {
      const aidStations: AidStation[] = state.distance.aid_stations || [];
      const avgSpeed = calculateRequiredSpeed(
        state.distance.distance_miles,
        state.goalTimeMinutes
      );

      // Create segments between checkpoints
      const stations = [
        { name: "Start", mile: 0 },
        ...aidStations.sort((a, b) => a.mile - b.mile),
        { name: "Finish", mile: state.distance.distance_miles },
      ];

      const segments: PlanSegment[] = [];
      for (let i = 0; i < stations.length - 1; i++) {
        const start = stations[i]!;
        const end = stations[i + 1]!;
        const segDistance = end.mile - start.mile;
        const time = calculateSegmentTime(segDistance, avgSpeed);
        const powerRange = calculatePowerRange(
          state.athlete.ftp,
          state.athlete.altitudeAdjustmentFactor,
          "tempo"
        );

        segments.push({
          id: `seg-${i}`,
          startMile: start.mile,
          endMile: end.mile,
          startName: start.name,
          endName: end.name,
          targetTimeMinutes: time,
          effortLevel: "tempo",
          powerTargetLow: powerRange.low,
          powerTargetHigh: powerRange.high,
          nutritionNotes: "",
          hydrationNotes: "",
          terrainNotes: "",
          strategyNotes: "",
        });
      }

      dispatch({ type: "SET_SEGMENTS", segments });
    }
  }, [state.distance, state.goalTimeMinutes, state.segments.length]);

  const updateSegmentEffort = (segmentId: string, effortLevel: EffortLevel) => {
    const powerRange = calculatePowerRange(
      state.athlete.ftp,
      state.athlete.altitudeAdjustmentFactor,
      effortLevel
    );

    dispatch({
      type: "UPDATE_SEGMENT",
      segmentId,
      updates: {
        effortLevel,
        powerTargetLow: powerRange.low,
        powerTargetHigh: powerRange.high,
      },
    });
  };

  const adjustSegmentTime = (segmentId: string, deltaMinutes: number) => {
    const segment = state.segments.find((s) => s.id === segmentId);
    if (!segment) return;

    const newTime = Math.max(1, segment.targetTimeMinutes + deltaMinutes);
    dispatch({
      type: "UPDATE_SEGMENT",
      segmentId,
      updates: { targetTimeMinutes: newTime },
    });
  };

  // Calculate totals
  const totalTime = state.segments.reduce(
    (sum, seg) => sum + seg.targetTimeMinutes,
    0
  );
  const timeDiff = totalTime - state.goalTimeMinutes;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">
          Segment Strategy
        </h2>
        <p className="mt-1 text-sm text-brand-navy-600">
          Adjust effort levels and timing for each segment of your race
        </p>
      </div>

      {/* Time Summary */}
      <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-brand-navy-600">Segment Total:</span>{" "}
            <span className="font-mono font-medium text-brand-navy-900">
              {formatDuration(totalTime)}
            </span>
          </div>
          <div>
            <span className="text-sm text-brand-navy-600">Goal Time:</span>{" "}
            <span className="font-mono font-medium text-brand-navy-900">
              {formatDuration(state.goalTimeMinutes)}
            </span>
          </div>
          <div
            className={cn(
              "px-2 py-1 rounded text-sm font-medium",
              Math.abs(timeDiff) < 5 && "bg-emerald-100 text-emerald-700",
              timeDiff >= 5 && "bg-amber-100 text-amber-700",
              timeDiff <= -5 && "bg-blue-100 text-blue-700"
            )}
          >
            {timeDiff > 0 ? "+" : ""}
            {Math.round(timeDiff)} min
          </div>
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-4">
        {state.segments.map((segment, index) => {
          const distance = segment.endMile - segment.startMile;
          const speed = calculateRequiredSpeed(distance, segment.targetTimeMinutes);

          return (
            <div
              key={segment.id}
              className="p-4 rounded-lg border border-brand-navy-200 bg-white hover:border-brand-navy-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Segment Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-brand-navy-500">
                      Segment {index + 1}
                    </span>
                    <Route className="h-3.5 w-3.5 text-brand-navy-400" />
                    <span className="text-xs text-brand-navy-500">
                      {distance.toFixed(1)} mi
                    </span>
                  </div>
                  <h3 className="font-medium text-brand-navy-900 truncate">
                    {segment.startName} → {segment.endName}
                  </h3>
                  <p className="text-xs text-brand-navy-500 mt-0.5">
                    Mile {segment.startMile.toFixed(1)} - {segment.endMile.toFixed(1)}
                  </p>
                </div>

                {/* Effort Level Selector */}
                <div className="flex items-center gap-1">
                  {EFFORT_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => updateSegmentEffort(segment.id, level.value)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded border transition-colors",
                        segment.effortLevel === level.value
                          ? level.color
                          : "bg-white border-brand-navy-200 text-brand-navy-600 hover:bg-brand-navy-50"
                      )}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>

                {/* Time Adjuster */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => adjustSegmentTime(segment.id, -5)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <div className="text-center min-w-[80px]">
                    <div className="flex items-center justify-center gap-1 font-mono font-medium text-brand-navy-900">
                      <Clock className="h-3.5 w-3.5 text-brand-navy-400" />
                      {formatDuration(segment.targetTimeMinutes)}
                    </div>
                    <p className="text-xs text-brand-navy-500">
                      {speed.toFixed(1)} mph
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => adjustSegmentTime(segment.id, 5)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>

                {/* Power Range */}
                <div className="text-right min-w-[100px]">
                  <div className="flex items-center justify-end gap-1 font-mono text-brand-navy-900">
                    <Zap className="h-3.5 w-3.5 text-brand-sky-500" />
                    <span>
                      {segment.powerTargetLow}-{segment.powerTargetHigh}w
                    </span>
                  </div>
                  <p className="text-xs text-brand-navy-500">Flat - Climb</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.segments.length === 0 && (
        <div className="text-center py-8 bg-brand-navy-50 rounded-lg">
          <Route className="h-8 w-8 text-brand-navy-300 mx-auto mb-2" />
          <p className="text-brand-navy-600">
            Set your goal time to generate segments.
          </p>
        </div>
      )}
    </div>
  );
}
