"use client";

import { Route } from "lucide-react";
import type { RaceEdition, RaceDistance } from "@/types/race-detail";
import { DistanceCard } from "./DistanceCard";

interface CourseTabProps {
  latestEdition: RaceEdition | undefined;
  onDistanceSelect: (distance: RaceDistance) => void;
}

export function CourseTab({ latestEdition, onDistanceSelect }: CourseTabProps) {
  if (!latestEdition || latestEdition.race_distances.length === 0) {
    return (
      <div className="text-center py-12">
        <Route className="h-12 w-12 mx-auto text-brand-navy-300 mb-4" />
        <p className="text-brand-navy-600">
          No distance information available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {latestEdition.race_distances.map((distance) => (
        <DistanceCard
          key={distance.id}
          distance={distance}
          onClick={() => onDistanceSelect(distance)}
        />
      ))}
    </div>
  );
}
