"use client";

import { Thermometer, Car, Flag, Users, Route } from "lucide-react";
import type { Race, RaceEdition } from "@/types/race-detail";
import { InfoCard } from "./InfoCard";
import { DistancePreviewCard } from "./DistancePreviewCard";

interface OverviewTabProps {
  race: Race;
  latestEdition: RaceEdition | undefined;
}

export function OverviewTab({ race, latestEdition }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* About Section */}
      {race.description && (
        <section>
          <h2 className="text-xl font-heading font-bold text-brand-navy-900 mb-4">
            About the Race
          </h2>
          <p className="text-brand-navy-700 leading-relaxed text-lg">
            {race.description}
          </p>
        </section>
      )}

      {/* Info Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {race.weather_notes && (
          <InfoCard
            icon={<Thermometer className="h-5 w-5" />}
            title="Weather & Conditions"
            content={race.weather_notes}
          />
        )}
        {race.parking_info && (
          <InfoCard
            icon={<Car className="h-5 w-5" />}
            title="Parking"
            content={race.parking_info}
          />
        )}
        {race.course_marking && (
          <InfoCard
            icon={<Flag className="h-5 w-5" />}
            title="Course Marking"
            content={race.course_marking}
          />
        )}
        {race.crew_info && (
          <InfoCard
            icon={<Users className="h-5 w-5" />}
            title="Crew Access"
            content={race.crew_info}
          />
        )}
        {race.drop_bag_info && (
          <InfoCard
            icon={<Route className="h-5 w-5" />}
            title="Drop Bags"
            content={race.drop_bag_info}
          />
        )}
        {race.course_rules && (
          <InfoCard
            icon={<Flag className="h-5 w-5" />}
            title="Course Rules"
            content={race.course_rules}
          />
        )}
      </section>

      {/* Distance Preview */}
      {latestEdition && latestEdition.race_distances.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-bold text-brand-navy-900">
              {latestEdition.year} Distance Options
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestEdition.race_distances.slice(0, 3).map((distance) => (
              <DistancePreviewCard key={distance.id} distance={distance} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
