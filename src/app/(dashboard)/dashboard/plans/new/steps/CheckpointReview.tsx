"use client";

import { useEffect } from "react";
import { MapPin, Clock, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanBuilder, type CheckpointTiming } from "../context/PlanBuilderContext";
import {
  calculateArrivalTime,
  calculateCutoffMargin,
  getCutoffStatus,
  formatDuration,
} from "@/lib/calculations";
import type { AidStation } from "@/types";

export function CheckpointReview() {
  const { state, dispatch } = usePlanBuilder();

  // Calculate checkpoint timings based on goal time and aid stations
  useEffect(() => {
    if (!state.distance || state.goalTimeMinutes <= 0) return;

    const aidStations: AidStation[] = state.distance.aid_stations || [];
    const distance = state.distance.distance_miles;
    const avgSpeedMph = (distance / state.goalTimeMinutes) * 60;

    // Generate checkpoints from aid stations
    const checkpoints: CheckpointTiming[] = [];

    // Start
    checkpoints.push({
      name: "Start",
      mile: 0,
      elapsedMinutes: 0,
      arrivalTime: calculateArrivalTime(state.startTime, 0),
    });

    // Aid stations
    let prevMile = 0;
    let totalMinutes = 0;

    for (const station of aidStations.sort((a, b) => a.mile - b.mile)) {
      const segmentDistance = station.mile - prevMile;
      const segmentTime = (segmentDistance / avgSpeedMph) * 60;
      totalMinutes += segmentTime;

      const arrivalTime = calculateArrivalTime(state.startTime, totalMinutes);
      const checkpoint: CheckpointTiming = {
        name: station.name,
        mile: station.mile,
        elapsedMinutes: totalMinutes,
        arrivalTime,
      };

      if (station.cutoff_time) {
        const margin = calculateCutoffMargin(arrivalTime, station.cutoff_time);
        checkpoint.cutoffTime = station.cutoff_time;
        checkpoint.cutoffMargin = margin;
        checkpoint.cutoffStatus = getCutoffStatus(margin);
      }

      checkpoints.push(checkpoint);
      prevMile = station.mile;
    }

    // Finish
    checkpoints.push({
      name: "Finish",
      mile: distance,
      elapsedMinutes: state.goalTimeMinutes,
      arrivalTime: calculateArrivalTime(state.startTime, state.goalTimeMinutes),
    });

    dispatch({ type: "SET_CHECKPOINTS", checkpoints });
  }, [state.distance, state.goalTimeMinutes, state.startTime]);

  const StatusIcon = ({ status }: { status?: "safe" | "caution" | "danger" }) => {
    if (!status) return null;
    switch (status) {
      case "safe":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "caution":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "danger":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const formatMargin = (minutes?: number) => {
    if (minutes === undefined) return "";
    const hrs = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.round(Math.abs(minutes) % 60);
    const sign = minutes >= 0 ? "+" : "-";
    if (hrs > 0) {
      return `${sign}${hrs}h ${mins}m`;
    }
    return `${sign}${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">
          Checkpoint Schedule
        </h2>
        <p className="mt-1 text-sm text-brand-navy-600">
          Review your target arrival times at each checkpoint
        </p>
      </div>

      {/* Race Summary */}
      <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-brand-navy-600">Race:</span>{" "}
            <span className="font-medium text-brand-navy-900">{state.raceName}</span>
          </div>
          <div>
            <span className="text-brand-navy-600">Distance:</span>{" "}
            <span className="font-medium text-brand-navy-900">
              {state.distance?.distance_miles} mi
            </span>
          </div>
          <div>
            <span className="text-brand-navy-600">Goal Time:</span>{" "}
            <span className="font-medium text-brand-navy-900">
              {formatDuration(state.goalTimeMinutes)}
            </span>
          </div>
          <div>
            <span className="text-brand-navy-600">Start:</span>{" "}
            <span className="font-medium text-brand-navy-900">
              {calculateArrivalTime(state.startTime, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Checkpoint List */}
      {state.checkpoints.length > 0 ? (
        <div className="space-y-3">
          {state.checkpoints.map((checkpoint) => (
            <div
              key={checkpoint.name}
              className={cn(
                "p-4 rounded-lg border-2 transition-colors",
                checkpoint.cutoffStatus === "danger" && "border-red-200 bg-red-50",
                checkpoint.cutoffStatus === "caution" && "border-amber-200 bg-amber-50",
                checkpoint.cutoffStatus === "safe" && "border-emerald-200 bg-emerald-50",
                !checkpoint.cutoffStatus && "border-brand-navy-200 bg-white"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <MapPin className="h-5 w-5 text-brand-navy-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-brand-navy-900">
                      {checkpoint.name}
                    </h3>
                    <p className="text-sm text-brand-navy-600">
                      Mile {checkpoint.mile.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-brand-navy-900">
                      <Clock className="h-4 w-4 text-brand-navy-400" />
                      <span className="font-mono font-medium">
                        {checkpoint.arrivalTime}
                      </span>
                    </div>
                    <p className="text-xs text-brand-navy-500">
                      +{formatDuration(checkpoint.elapsedMinutes)}
                    </p>
                  </div>

                  {checkpoint.cutoffTime && (
                    <div className="flex items-center gap-2 pl-4 border-l border-brand-navy-200">
                      <StatusIcon status={checkpoint.cutoffStatus} />
                      <div className="text-right">
                        <p className="text-sm text-brand-navy-600">
                          Cutoff: {checkpoint.cutoffTime}
                        </p>
                        <p
                          className={cn(
                            "text-xs font-medium",
                            checkpoint.cutoffStatus === "safe" && "text-emerald-600",
                            checkpoint.cutoffStatus === "caution" && "text-amber-600",
                            checkpoint.cutoffStatus === "danger" && "text-red-600"
                          )}
                        >
                          {formatMargin(checkpoint.cutoffMargin)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-brand-navy-50 rounded-lg">
          <MapPin className="h-8 w-8 text-brand-navy-300 mx-auto mb-2" />
          <p className="text-brand-navy-600">
            No checkpoints available for this race yet.
          </p>
          <p className="text-sm text-brand-navy-500 mt-1">
            Checkpoints will be added by the race administrator.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-brand-navy-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Safe margin (60+ min)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Caution (30-60 min)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Tight margin (&lt;30 min)</span>
        </div>
      </div>
    </div>
  );
}
