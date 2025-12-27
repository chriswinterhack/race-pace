"use client";

import { TrendingUp, Bike, Circle } from "lucide-react";
import type { RaceGearStats } from "@/types/race-detail";
import { combineTires } from "@/lib/utils/race";
import { GearSection } from "./GearSection";

interface CommunityTabProps {
  gearStats: RaceGearStats | null;
  raceId?: string;
  compact?: boolean;
}

export function CommunityTab({
  gearStats,
  compact = false,
}: CommunityTabProps) {
  if (!gearStats || gearStats.total_participants === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 mx-auto text-brand-navy-300 mb-4" />
        <h3 className="text-lg font-semibold text-brand-navy-900">
          No gear data yet
        </h3>
        <p className="mt-2 text-brand-navy-600">
          Be the first to share your setup for this race!
        </p>
      </div>
    );
  }

  const combinedTires = combineTires(
    gearStats.front_tires,
    gearStats.rear_tires
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold text-brand-navy-900">
              Community Gear Choices
            </h2>
            <p className="mt-1 text-brand-navy-600">
              See what {gearStats.total_participants}{" "}
              {gearStats.total_participants === 1 ? "rider is" : "riders are"}{" "}
              running for this race
            </p>
          </div>
        </div>
      )}

      {/* Bikes */}
      {gearStats.bikes.length > 0 && (
        <GearSection
          title="Popular Bikes"
          icon={<Bike className="h-5 w-5" />}
          items={gearStats.bikes}
          color="sky"
        />
      )}

      {/* Tires */}
      {combinedTires.length > 0 && (
        <GearSection
          title="Popular Tires"
          icon={<Circle className="h-5 w-5" />}
          items={combinedTires}
          color="amber"
        />
      )}
    </div>
  );
}
