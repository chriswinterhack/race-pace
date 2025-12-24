"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, Mountain, Route, Users } from "lucide-react";
import {
  cn,
  formatDistance,
  formatElevation,
  getDisplayDistance,
  getDistanceUnit,
  generateGradient,
} from "@/lib/utils";
import { useUnits } from "@/hooks";
import type { UnitPreference } from "@/types";

interface RaceCardProps {
  name: string;
  slug: string;
  location: string | null;
  heroImageUrl: string | null;
  dateRange: string | null;
  distances: { miles: number; elevationGain: number | null }[];
  participantCount?: number;
  raceSubtype?: string;
  variant?: "default" | "compact";
  href?: string;
}

// Format distance display
function formatDistancesForCard(
  distances: { miles: number; elevationGain: number | null }[],
  units: UnitPreference
): {
  distanceText: string;
  elevationText: string | null;
} {
  if (distances.length === 0) {
    return { distanceText: "", elevationText: null };
  }

  // Get unique distances sorted descending
  const uniqueMiles = [...new Set(distances.map(d => d.miles))].sort((a, b) => b - a);
  const unit = getDistanceUnit(units);

  let distanceText: string;
  if (uniqueMiles.length > 1) {
    const minDisplay = Math.round(getDisplayDistance(uniqueMiles[uniqueMiles.length - 1]!, units));
    const maxDisplay = Math.round(getDisplayDistance(uniqueMiles[0]!, units));
    distanceText = `${minDisplay}-${maxDisplay} ${unit}`;
  } else {
    distanceText = formatDistance(uniqueMiles[0]!, units, { decimals: 0 });
  }

  // Get elevation range
  const elevations = distances.map(d => d.elevationGain || 0).filter(e => e > 0);
  if (elevations.length === 0) {
    return { distanceText, elevationText: null };
  }

  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);

  // Show range if there's meaningful difference, otherwise show single value or "Up to"
  let elevationText: string;
  if (elevations.length === 1 || minElevation === maxElevation) {
    elevationText = formatElevation(maxElevation, units);
  } else {
    elevationText = `Up to ${formatElevation(maxElevation, units)}`;
  }

  return { distanceText, elevationText };
}

export function RaceCard({
  name,
  slug,
  location,
  heroImageUrl,
  dateRange,
  distances,
  participantCount = 0,
  raceSubtype,
  variant = "default",
  href,
}: RaceCardProps) {
  const { units } = useUnits();
  const { distanceText, elevationText } = formatDistancesForCard(distances, units);
  const gradient = generateGradient(name);
  const linkHref = href || `/dashboard/races/${slug}`;

  const isCompact = variant === "compact";

  return (
    <Link href={linkHref} className="group block">
      <article className={cn(
        "relative overflow-hidden rounded-2xl bg-white",
        "shadow-md hover:shadow-xl transition-all duration-300",
        "border border-brand-navy-100 hover:border-brand-sky-300",
        "transform hover:-translate-y-1",
        isCompact ? "h-64" : "h-80"
      )}>
        {/* Hero Image or Gradient */}
        <div className={cn(
          "relative w-full overflow-hidden",
          isCompact ? "h-36" : "h-48"
        )}>
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br",
              gradient
            )}>
              {/* Subtle pattern overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>
          )}

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Stats Badge - positioned on image */}
          {(distanceText || elevationText) && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-navy-900/90 backdrop-blur-sm text-white text-sm font-medium shadow-lg">
                <Route className="h-3.5 w-3.5 text-brand-sky-400" />
                {distanceText}
                {elevationText && (
                  <>
                    <span className="text-brand-navy-400 mx-0.5">•</span>
                    <Mountain className="h-3.5 w-3.5 text-brand-sky-400" />
                    {elevationText}
                  </>
                )}
              </span>
            </div>
          )}

          {/* Race Type Badge */}
          {raceSubtype && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-brand-navy-700 text-xs font-semibold uppercase tracking-wide shadow-md">
                {raceSubtype === "cx" ? "Cyclocross" : raceSubtype}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={cn(
          "p-4",
          isCompact ? "space-y-2" : "space-y-3"
        )}>
          {/* Race Name */}
          <h3 className={cn(
            "font-heading font-bold text-brand-navy-900 group-hover:text-brand-sky-600 transition-colors line-clamp-2",
            isCompact ? "text-base" : "text-lg"
          )}>
            {name}
          </h3>

          {/* Meta Info */}
          <div className={cn(
            "flex flex-wrap items-center gap-x-3 gap-y-1 text-brand-navy-600",
            isCompact ? "text-xs" : "text-sm"
          )}>
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className={cn(
                  "text-brand-sky-500",
                  isCompact ? "h-3 w-3" : "h-3.5 w-3.5"
                )} />
                <span className="truncate max-w-[150px]">{location}</span>
              </span>
            )}
            {dateRange && (
              <span className="flex items-center gap-1">
                <Calendar className={cn(
                  "text-brand-sky-500",
                  isCompact ? "h-3 w-3" : "h-3.5 w-3.5"
                )} />
                {dateRange}
              </span>
            )}
          </div>

          {/* Participant Count */}
          {participantCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-brand-sky-600 font-medium">
              <Users className="h-3 w-3" />
              {participantCount} {participantCount === 1 ? "athlete planning" : "athletes planning"}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

// Skeleton loader for RaceCard
export function RaceCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" }) {
  const isCompact = variant === "compact";

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl bg-white border border-brand-navy-100",
      isCompact ? "h-64" : "h-80"
    )}>
      <div className={cn(
        "bg-brand-navy-100 animate-pulse",
        isCompact ? "h-36" : "h-48"
      )} />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-brand-navy-100 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-brand-navy-100 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
