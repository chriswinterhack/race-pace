"use client";

import { DialogHeader, DialogTitle } from "@/components/ui";
import { cn, formatDistance, formatElevation, formatDateShort } from "@/lib/utils";
import { formatRaceTime } from "@/lib/utils/race";
import { formatDuration } from "@/lib/calculations";
import { useUnits } from "@/hooks";
import type { RaceDistance } from "@/types/race-detail";
import { StatBox } from "./StatBox";

interface DistanceDetailModalProps {
  distance: RaceDistance;
}

export function DistanceDetailModal({ distance }: DistanceDetailModalProps) {
  const { units } = useUnits();

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">
          {distance.name ||
            formatDistance(distance.distance_miles, units, { decimals: 0 })}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 mt-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatBox
            label="Distance"
            value={formatDistance(distance.distance_miles, units)}
          />
          {distance.elevation_gain && (
            <StatBox
              label="Elevation Gain"
              value={formatElevation(distance.elevation_gain, units)}
            />
          )}
          {distance.elevation_loss && (
            <StatBox
              label="Elevation Loss"
              value={formatElevation(distance.elevation_loss, units)}
            />
          )}
          {distance.time_limit_minutes && (
            <StatBox
              label="Time Limit"
              value={formatDuration(distance.time_limit_minutes)}
            />
          )}
          {distance.date && (
            <StatBox label="Date" value={formatDateShort(distance.date)!} />
          )}
          {distance.start_time && (
            <StatBox
              label="Start Time"
              value={formatRaceTime(distance.start_time)}
            />
          )}
        </div>

        {/* Aid Stations */}
        {distance.aid_stations && distance.aid_stations.length > 0 && (
          <div>
            <h3 className="font-semibold text-brand-navy-900 mb-3">
              Aid Stations & Checkpoints
            </h3>
            <div className="space-y-2">
              {distance.aid_stations.map((station, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    station.type === "checkpoint"
                      ? "bg-brand-sky-50 border border-brand-sky-200"
                      : "bg-emerald-50 border border-emerald-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        station.type === "checkpoint"
                          ? "bg-brand-sky-200 text-brand-sky-700"
                          : "bg-emerald-200 text-emerald-700"
                      )}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-brand-navy-900">
                        {station.name}
                      </p>
                      <p className="text-sm text-brand-navy-500">
                        {units === "metric" ? "Km" : "Mile"}{" "}
                        {units === "metric"
                          ? (station.mile * 1.60934).toFixed(1)
                          : station.mile}
                        {station.cutoff_time &&
                          ` · Cutoff: ${station.cutoff_time}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded",
                      station.type === "checkpoint"
                        ? "bg-brand-sky-100 text-brand-sky-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {station.type === "checkpoint" ? "Checkpoint" : "Aid Station"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
