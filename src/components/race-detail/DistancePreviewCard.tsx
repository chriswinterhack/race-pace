"use client";

import { Mountain, Clock, Flag, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { formatDistance, getDistanceUnit, formatDateShort } from "@/lib/utils";
import { formatElevation } from "@/lib/utils";
import { formatRaceTime } from "@/lib/utils/race";
import { useUnits } from "@/hooks";
import type { RaceDistance } from "@/types/race-detail";

interface DistancePreviewCardProps {
  distance: RaceDistance;
}

export function DistancePreviewCard({ distance }: DistancePreviewCardProps) {
  const { units } = useUnits();

  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-brand-navy-50 to-brand-sky-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-brand-navy-900">
                {formatDistance(distance.distance_miles, units, {
                  includeUnit: false,
                })}
                <span className="text-lg font-normal text-brand-navy-500 ml-1">
                  {getDistanceUnit(units)}
                </span>
              </p>
              {distance.name && (
                <p className="text-sm font-medium text-brand-navy-600 mt-1">
                  {distance.name}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-brand-navy-400 group-hover:text-brand-sky-500 transition-colors" />
          </div>
        </div>
        {/* Stats */}
        <div className="p-5 space-y-2">
          {distance.elevation_gain && (
            <div className="flex items-center gap-2 text-sm text-brand-navy-600">
              <Mountain className="h-4 w-4 text-brand-navy-400" />
              {formatElevation(distance.elevation_gain, units)} gain
            </div>
          )}
          {distance.date && distance.start_time && (
            <div className="flex items-center gap-2 text-sm text-brand-navy-600">
              <Clock className="h-4 w-4 text-brand-navy-400" />
              {formatDateShort(distance.date)!} at{" "}
              {formatRaceTime(distance.start_time)}
            </div>
          )}
          {distance.aid_stations && distance.aid_stations.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-brand-navy-600">
              <Flag className="h-4 w-4 text-brand-navy-400" />
              {distance.aid_stations.length} checkpoints
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
