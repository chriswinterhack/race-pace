"use client";

import { Calendar, Clock, Mountain, Timer, Flag } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { formatDistance, formatElevation, formatDateShort } from "@/lib/utils";
import { formatRaceTime } from "@/lib/utils/race";
import { formatDuration } from "@/lib/calculations";
import { useUnits } from "@/hooks";
import type { RaceDistance } from "@/types/race-detail";
import { SurfaceBar } from "./SurfaceBar";

interface DistanceCardProps {
  distance: RaceDistance;
  onClick: () => void;
}

export function DistanceCard({ distance, onClick }: DistanceCardProps) {
  const { units } = useUnits();
  const surface = distance.surface_composition;
  const hasSurface = surface && Object.values(surface).some((v) => v && v > 0);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Left: Main Info */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-brand-navy-900">
                  {formatDistance(distance.distance_miles, units, {
                    includeUnit: false,
                  })}
                  <span className="text-base font-normal text-brand-navy-500 ml-1">
                    {units === "metric" ? "kilometers" : "miles"}
                  </span>
                </h3>
                {distance.name && (
                  <p className="text-lg font-medium text-brand-sky-600 mt-1">
                    {distance.name}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={onClick}>
                View Details
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 flex flex-wrap gap-4">
              {distance.date && (
                <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                  <Calendar className="h-4 w-4 text-brand-navy-400" />
                  {formatDateShort(distance.date)!}
                </div>
              )}
              {distance.start_time && (
                <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                  <Clock className="h-4 w-4 text-brand-navy-400" />
                  {formatRaceTime(distance.start_time)}
                </div>
              )}
              {distance.elevation_gain && (
                <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                  <Mountain className="h-4 w-4 text-brand-navy-400" />
                  {formatElevation(distance.elevation_gain, units)} gain
                </div>
              )}
              {distance.time_limit_minutes && (
                <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                  <Timer className="h-4 w-4 text-brand-navy-400" />
                  {formatDuration(distance.time_limit_minutes)} limit
                </div>
              )}
              {distance.aid_stations && distance.aid_stations.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                  <Flag className="h-4 w-4 text-brand-navy-400" />
                  {distance.aid_stations.length} checkpoints
                </div>
              )}
            </div>

            {/* Surface Composition */}
            {hasSurface && <SurfaceBar surface={surface!} />}
          </div>

          {/* Right: Aid Stations Preview */}
          {distance.aid_stations && distance.aid_stations.length > 0 && (
            <div className="lg:w-80 p-6 bg-brand-navy-50 border-t lg:border-t-0 lg:border-l border-brand-navy-100">
              <h4 className="text-sm font-semibold text-brand-navy-700 mb-3">
                Checkpoints
              </h4>
              <div className="space-y-2">
                {distance.aid_stations.slice(0, 4).map((station, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-brand-navy-700 truncate pr-2">
                      {station.name}
                    </span>
                    <span className="text-brand-navy-500 font-mono text-xs">
                      {units === "metric" ? "Km" : "Mi"}{" "}
                      {units === "metric"
                        ? (station.mile * 1.60934).toFixed(1)
                        : station.mile}
                    </span>
                  </div>
                ))}
                {distance.aid_stations.length > 4 && (
                  <p className="text-xs text-brand-navy-500">
                    +{distance.aid_stations.length - 4} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
