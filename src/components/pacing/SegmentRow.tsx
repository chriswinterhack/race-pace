"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Flag,
  ChevronRight,
} from "lucide-react";
import { EditableTime } from "@/components/ui";
import { cn, formatDistance, formatElevation } from "@/lib/utils";
import { formatDuration } from "@/lib/calculations";
import { getTimeStatus } from "@/lib/utils/time";
import { SegmentETA } from "./SegmentETA";

// Effort level configuration
export const EFFORT_CONFIG = {
  safe: {
    label: "Safe",
    color: "emerald",
    description: "Sustainable pace, saving energy",
    intensityFactor: 0.67,
  },
  tempo: {
    label: "Tempo",
    color: "sky",
    description: "Target race pace",
    intensityFactor: 0.70,
  },
  pushing: {
    label: "Pushing",
    color: "orange",
    description: "Above target, high effort",
    intensityFactor: 0.73,
  },
} as const;

export type EffortLevel = keyof typeof EFFORT_CONFIG;

export interface SegmentData {
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
  arrivalTime: string;
  elapsedMinutes: number;
}

export interface AidStation {
  name: string;
  mile: number;
  cutoff_time?: string;
  type?: "aid_station" | "checkpoint";
}

interface SegmentRowProps {
  segment: SegmentData;
  index: number;
  totalSegments: number;
  effectiveDistance: number;
  units: "imperial" | "metric";
  allStations: AidStation[];
  onTimeChange: (segmentId: string, newTimeMinutes: number) => Promise<void>;
  onEffortChange: (segment: SegmentData, newEffort: string) => Promise<void>;
}

/**
 * Renders a single segment row in the pacing table
 * Includes expandable details, effort selection, and cutoff warnings
 */
export function SegmentRow({
  segment,
  index,
  totalSegments,
  effectiveDistance,
  units,
  allStations,
  onTimeChange,
  onEffortChange,
}: SegmentRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const effort = EFFORT_CONFIG[segment.effort_level as EffortLevel] || EFFORT_CONFIG.tempo;
  const distance = segment.end_mile - segment.start_mile;
  const pacePerMile = distance > 0 ? segment.target_time_minutes / distance : 0;
  const progressPercent = (segment.end_mile / effectiveDistance) * 100;
  const isFirst = index === 0;
  const isLast = index === totalSegments - 1;

  // Check if this segment ends at a checkpoint and get cutoff
  const endStation = allStations.find(
    (s) => Math.abs(s.mile - segment.end_mile) < 0.5
  );
  const isCheckpointSegment = endStation?.type === "checkpoint";
  const cutoff = endStation?.cutoff_time;
  const timeStatus = cutoff ? getTimeStatus(segment.arrivalTime, cutoff) : "ok";

  return (
    <div>
      {/* Segment Row */}
      <div
        className={cn(
          "group relative bg-white rounded-xl border transition-all duration-200",
          isExpanded
            ? "border-brand-sky-300 shadow-lg shadow-brand-sky-500/10"
            : "border-brand-navy-100 hover:border-brand-navy-200 hover:shadow-md"
        )}
      >
        {/* Main Row */}
        <div
          className="flex items-center gap-4 p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Split Number with Timeline Dot */}
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-colors",
                isFirst
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                  : isLast
                    ? "bg-gradient-to-br from-brand-sky-500 to-brand-sky-600 text-white"
                    : "bg-brand-navy-100 text-brand-navy-700 group-hover:bg-brand-navy-200"
              )}
            >
              {index + 1}
            </div>
            {/* Connection dot for timeline */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rounded-full bg-brand-sky-400 border-2 border-white hidden sm:block" />
          </div>

          {/* Segment Info */}
          <div className="flex-1 min-w-0">
            {/* Checkpoint label if this segment ends at a checkpoint */}
            {isCheckpointSegment && (
              <span className="inline-block text-xs font-semibold uppercase tracking-wide text-orange-600 bg-orange-100 px-2 py-0.5 rounded mb-1">
                Checkpoint
              </span>
            )}
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-brand-navy-900 truncate">
                {segment.start_name || `Mile ${segment.start_mile}`}
              </h4>
              <ChevronRight className="h-4 w-4 text-brand-navy-400 flex-shrink-0" />
              <span className="font-medium text-brand-navy-900 truncate flex items-center gap-1.5">
                {segment.end_name || `Mile ${segment.end_mile}`}
                {isLast && <Flag className="h-4 w-4 text-brand-sky-500" />}
                {isCheckpointSegment && !isLast && <Flag className="h-4 w-4 text-orange-500" />}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-brand-navy-500">
                {formatDistance(distance, units)}
              </span>
              {segment.elevation_gain != null && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-600 font-medium">
                    {formatElevation(segment.elevation_gain, units, { includeUnit: false })}
                  </span>
                  {segment.elevation_loss != null && segment.elevation_loss > 0 && (
                    <>
                      <TrendingDown className="h-3.5 w-3.5 text-red-400 ml-1" />
                      <span className="text-red-500 font-medium">
                        {formatElevation(segment.elevation_loss, units, { includeUnit: false })}
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Time & Arrival - Desktop */}
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-right" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-brand-navy-500 uppercase tracking-wide">Split Time</p>
              <EditableTime
                value={segment.target_time_minutes}
                onChange={(newTime) => onTimeChange(segment.id, newTime)}
                className="text-lg text-brand-navy-900"
              />
            </div>
            <SegmentETA
              arrivalTime={segment.arrivalTime}
              cutoff={cutoff}
              timeStatus={timeStatus}
            />
          </div>

          {/* Effort Badge */}
          <div className="flex-shrink-0">
            <select
              value={segment.effort_level}
              onChange={(e) => {
                e.stopPropagation();
                onEffortChange(segment, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "appearance-none cursor-pointer px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                effort.color === "emerald" && "bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500",
                effort.color === "sky" && "bg-sky-50 border-sky-200 text-sky-700 focus:ring-sky-500",
                effort.color === "orange" && "bg-orange-50 border-orange-200 text-orange-700 focus:ring-orange-500"
              )}
            >
              <option value="safe">Safe</option>
              <option value="tempo">Tempo</option>
              <option value="pushing">Pushing</option>
            </select>
          </div>
        </div>

        {/* Mobile Time Display */}
        <div className="sm:hidden flex items-start justify-between px-4 pb-4 pt-0 border-t border-brand-navy-50 mt-0">
          <div onClick={(e) => e.stopPropagation()}>
            <p className="text-xs text-brand-navy-500">Split Time</p>
            <EditableTime
              value={segment.target_time_minutes}
              onChange={(newTime) => onTimeChange(segment.id, newTime)}
              className="text-lg text-brand-navy-900"
            />
          </div>
          <SegmentETA
            arrivalTime={segment.arrivalTime}
            cutoff={cutoff}
            timeStatus={timeStatus}
            compact
          />
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-brand-navy-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-brand-navy-500 mb-1">Pace</p>
                <p className="font-mono font-semibold text-brand-navy-900">
                  {formatDuration(pacePerMile)}/mi
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-navy-500 mb-1">Elapsed</p>
                <p className="font-mono font-semibold text-brand-navy-900">
                  {formatDuration(segment.elapsedMinutes)}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-navy-500 mb-1">Progress</p>
                <p className="font-semibold text-brand-navy-900">
                  {progressPercent.toFixed(0)}% complete
                </p>
              </div>
              {segment.avg_gradient != null && (
                <div>
                  <p className="text-xs text-brand-navy-500 mb-1">Avg Grade</p>
                  <p
                    className={cn(
                      "font-semibold",
                      segment.avg_gradient > 2
                        ? "text-orange-600"
                        : segment.avg_gradient < -2
                          ? "text-green-600"
                          : "text-brand-navy-900"
                    )}
                  >
                    {segment.avg_gradient > 0 ? "+" : ""}
                    {segment.avg_gradient.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 bg-brand-navy-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-sky-400 to-brand-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-brand-navy-500">
                <span>Start</span>
                <span>{formatDistance(segment.end_mile, units)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
