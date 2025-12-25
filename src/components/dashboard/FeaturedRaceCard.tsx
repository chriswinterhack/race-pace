"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Calendar,
  Route,
  MapPin,
  Mountain,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn, formatDistance, formatElevation, parseLocalDate, generateGradient } from "@/lib/utils";

export interface FeaturedRace {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  hero_image_url: string | null;
  race_subtype: string | null;
  race_type: string;
  race_editions: Array<{
    id: string;
    year: number;
    race_distances: Array<{
      id: string;
      name: string | null;
      distance_miles: number;
      date: string | null;
      elevation_gain: number | null;
    }>;
  }>;
  participant_count?: number;
}

interface FeaturedRaceCardProps {
  race: FeaturedRace;
  index: number;
  units: "imperial" | "metric";
  onAddClick: () => void;
}

export function FeaturedRaceCard({
  race,
  index,
  units,
  onAddClick,
}: FeaturedRaceCardProps) {
  // Get the latest edition and earliest upcoming distance
  const latestEdition = race.race_editions?.[0];
  const distances = latestEdition?.race_distances || [];

  // Get the primary distance (first one, typically the main event)
  const primaryDistance = distances[0];

  // Format date
  const raceDate = primaryDistance?.date ? parseLocalDate(primaryDistance.date) : null;
  const formattedDate = raceDate?.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Days until race
  const daysUntil = raceDate
    ? Math.ceil((raceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link
      href={`/dashboard/races/${race.slug}`}
      className={cn(
        "group relative flex-shrink-0 w-[280px] lg:w-auto snap-start",
        "rounded-2xl overflow-hidden bg-white border border-brand-navy-100",
        "shadow-sm hover:shadow-xl transition-all duration-300",
        "hover:border-brand-sky-200 hover:-translate-y-1"
      )}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Image */}
      <div className="relative h-36 overflow-hidden">
        {race.hero_image_url ? (
          <Image
            src={race.hero_image_url}
            alt={race.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              generateGradient(race.name)
            )}
          >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badge */}
        {race.race_subtype && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-white/90 text-brand-navy-700 backdrop-blur-sm">
              {race.race_subtype}
            </span>
          </div>
        )}

        {/* Days until badge */}
        {daysUntil !== null && daysUntil > 0 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-brand-sky-500 text-white">
              {daysUntil}d
            </span>
          </div>
        )}

        {/* Location overlay */}
        {race.location && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-1.5 text-white/90 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{race.location}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-bold text-brand-navy-900 group-hover:text-brand-sky-600 transition-colors line-clamp-1">
          {race.name}
        </h3>

        {/* Stats row */}
        <div className="mt-2 flex items-center gap-3 text-sm text-brand-navy-500">
          {primaryDistance && (
            <span className="flex items-center gap-1">
              <Route className="h-3.5 w-3.5" />
              {formatDistance(primaryDistance.distance_miles, units)}
            </span>
          )}
          {primaryDistance?.elevation_gain && (
            <span className="flex items-center gap-1">
              <Mountain className="h-3.5 w-3.5" />
              {formatElevation(primaryDistance.elevation_gain, units)}
            </span>
          )}
        </div>

        {/* Date and participants */}
        <div className="mt-3 flex items-center justify-between">
          {formattedDate && (
            <span className="flex items-center gap-1.5 text-sm text-brand-navy-600">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
          )}
          {(race.participant_count || 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-brand-navy-400">
              <Users className="h-3 w-3" />
              {race.participant_count} planning
            </span>
          )}
        </div>

        {/* Distance options */}
        {distances.length > 1 && (
          <div className="mt-3 pt-3 border-t border-brand-navy-100">
            <p className="text-xs text-brand-navy-400">
              {distances.length} distance options available
            </p>
          </div>
        )}
      </div>

      {/* Hover action */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          className="w-full gap-2 bg-brand-sky-500 hover:bg-brand-sky-600"
          onClick={(e) => {
            e.preventDefault();
            onAddClick();
          }}
        >
          <Plus className="h-4 w-4" />
          Add to My Races
        </Button>
      </div>
    </Link>
  );
}
