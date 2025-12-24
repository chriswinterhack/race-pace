"use client";

import { useMemo } from "react";
import { Route, Mountain, TrendingDown, Clock } from "lucide-react";
import { useElevationPlannerStore } from "@/stores/elevationPlannerStore";
import { EFFORT_COLORS } from "./types";
import type { PlannerSegment, PlannerAidStation } from "./types";
import { cn, formatDistance, formatElevation } from "@/lib/utils";
import { formatDuration } from "@/lib/calculations";
import { useUnits } from "@/hooks";

interface TimelineSummaryProps {
  segments: PlannerSegment[];
  aidStations: PlannerAidStation[];
  raceStartTime: string;
  totalDistance: number;
  className?: string;
}

export function TimelineSummary({
  segments,
  aidStations,
  raceStartTime: _raceStartTime,
  totalDistance,
  className,
}: TimelineSummaryProps) {
  // _raceStartTime available for future finish time display
  void _raceStartTime;
  const { elevationData, selectedSegmentId, selectSegment } = useElevationPlannerStore();
  const { units } = useUnits();

  // Calculate summary stats
  const stats = useMemo(() => {
    const movingTimeMinutes = segments.reduce((sum, s) => sum + s.target_time_minutes, 0);
    const aidDelayMinutes = aidStations.reduce((sum, a) => sum + a.delayMinutes, 0);
    const totalTimeMinutes = movingTimeMinutes + aidDelayMinutes;

    // Calculate elevation gain/loss from actual elevation data
    let elevationGain = 0;
    let elevationLoss = 0;
    for (let i = 1; i < elevationData.length; i++) {
      const diff = (elevationData[i]?.elevation || 0) - (elevationData[i - 1]?.elevation || 0);
      if (diff > 0) {
        elevationGain += diff;
      } else {
        elevationLoss += Math.abs(diff);
      }
    }

    return {
      totalDistance,
      elevationGain: Math.round(elevationGain),
      elevationLoss: Math.round(elevationLoss),
      aidStationCount: aidStations.length,
      totalTimeMinutes,
      segmentCount: segments.length,
    };
  }, [segments, aidStations, totalDistance, elevationData]);

  // Get selected segment stats
  const selectedSegment = useMemo(() => {
    if (!selectedSegmentId) return null;
    return segments.find(s => s.id === selectedSegmentId);
  }, [selectedSegmentId, segments]);

  // Calculate segment stats for display
  const selectedStats = useMemo(() => {
    if (!selectedSegment) return null;

    const segmentPoints = elevationData.filter(
      p => p.mile >= selectedSegment.start_mile && p.mile <= selectedSegment.end_mile
    );

    let gain = 0;
    let loss = 0;
    for (let i = 1; i < segmentPoints.length; i++) {
      const diff = (segmentPoints[i]?.elevation || 0) - (segmentPoints[i - 1]?.elevation || 0);
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }

    return {
      distance: selectedSegment.end_mile - selectedSegment.start_mile,
      gain: Math.round(gain),
      loss: Math.round(loss),
      time: selectedSegment.target_time_minutes,
    };
  }, [selectedSegment, elevationData]);

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-brand-navy-900/90 backdrop-blur-sm",
        "border border-white/10",
        className
      )}
    >
      {/* Stats row - shows selected segment stats or total */}
      <div className="flex items-center justify-center gap-8 py-3 px-6 border-b border-white/10">
        {selectedStats ? (
          <>
            {/* Selected segment stats */}
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-4 w-4 text-brand-sky-400" />
              <span className="text-base font-semibold tabular-nums">{formatDuration(selectedStats.time)}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Route className="h-4 w-4 text-brand-sky-400" />
              <span className="text-base font-semibold tabular-nums">{formatDistance(selectedStats.distance, units, { decimals: 2 })}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Mountain className="h-4 w-4 text-green-400" />
              <span className="text-base font-semibold tabular-nums">{formatElevation(selectedStats.gain, units, { showSign: true })}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-base font-semibold tabular-nums">{formatElevation(-selectedStats.loss, units, { showSign: true })}</span>
            </div>
          </>
        ) : (
          <>
            {/* Total race stats */}
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-4 w-4 text-brand-sky-400" />
              <span className="text-base font-semibold tabular-nums">{formatDuration(stats.totalTimeMinutes)}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Route className="h-4 w-4 text-brand-sky-400" />
              <span className="text-base font-semibold tabular-nums">{formatDistance(stats.totalDistance, units, { decimals: 2 })}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Mountain className="h-4 w-4 text-green-400" />
              <span className="text-base font-semibold tabular-nums">{formatElevation(stats.elevationGain, units, { showSign: true })}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-base font-semibold tabular-nums">{formatElevation(-stats.elevationLoss, units, { showSign: true })}</span>
            </div>
          </>
        )}
      </div>

      {/* Proportionally sized segment tabs */}
      <div className="flex py-2 px-2">
        {segments.map((segment, index) => {
          const segmentDistance = segment.end_mile - segment.start_mile;
          const widthPercent = (segmentDistance / totalDistance) * 100;
          const isSelected = selectedSegmentId === segment.id;
          const effortConfig = EFFORT_COLORS[segment.effort_level];

          return (
            <button
              key={segment.id}
              onClick={() => selectSegment(isSelected ? null : segment.id)}
              style={{ width: `${widthPercent}%` }}
              className={cn(
                "relative py-2 px-1 mx-0.5 rounded-md transition-all",
                "text-xs font-semibold tabular-nums",
                "border",
                isSelected
                  ? "bg-brand-navy-700 border-brand-sky-500 text-white"
                  : "bg-brand-navy-800/50 border-transparent text-white/70 hover:bg-brand-navy-700/50 hover:text-white"
              )}
            >
              {/* Effort color indicator at bottom */}
              <div
                className={cn(
                  "absolute bottom-0 left-1 right-1 h-0.5 rounded-full",
                  effortConfig.badge
                )}
              />
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* Entire Race button */}
      <div className="px-2 pb-2">
        <button
          onClick={() => selectSegment(null)}
          className={cn(
            "w-full py-2 rounded-md text-sm font-medium transition-all",
            "border",
            !selectedSegmentId
              ? "bg-brand-navy-700 border-brand-sky-500/50 text-white"
              : "bg-transparent border-white/10 text-white/60 hover:bg-brand-navy-800 hover:text-white"
          )}
        >
          Entire Race
        </button>
      </div>
    </div>
  );
}
