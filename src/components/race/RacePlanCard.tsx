"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, Clock, ChevronRight, Mountain, Route } from "lucide-react";
import { cn, formatDistance, formatElevation, generateGradient } from "@/lib/utils";
import { useUnits } from "@/hooks";

interface RacePlanCardProps {
  planId: string;
  raceName: string;
  location: string | null;
  heroImageUrl: string | null;
  distanceName: string | null;
  distanceMiles: number;
  elevationGain: number | null;
  date: string | null;
  goalTime: string | null;
  daysUntil: number | null;
  isPast?: boolean;
  progressBadges?: { label: string; complete: boolean }[];
}

export function RacePlanCard({
  planId,
  raceName,
  location,
  heroImageUrl,
  distanceName,
  distanceMiles,
  elevationGain,
  date,
  goalTime,
  daysUntil,
  isPast = false,
  progressBadges = [],
}: RacePlanCardProps) {
  const { units } = useUnits();
  const gradient = generateGradient(raceName);
  const displayName = distanceName
    ? `${distanceName} (${formatDistance(distanceMiles, units)})`
    : formatDistance(distanceMiles, units);

  return (
    <Link href={`/dashboard/race/${planId}`} className="group block">
      <article className={cn(
        "relative overflow-hidden rounded-2xl bg-white",
        "shadow-md hover:shadow-xl transition-all duration-300",
        "border border-brand-navy-100 hover:border-brand-sky-300",
        "transform hover:-translate-y-0.5",
        isPast && "opacity-75"
      )}>
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="relative w-full sm:w-48 md:w-56 h-32 sm:h-auto flex-shrink-0">
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt={raceName}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 224px"
              />
            ) : (
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br",
                gradient
              )}>
                {/* Pattern overlay */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent sm:bg-gradient-to-t sm:from-black/50 sm:via-transparent sm:to-transparent" />

            {/* Days countdown badge - mobile */}
            {daysUntil !== null && daysUntil > 0 && !isPast && (
              <div className="absolute top-3 right-3 sm:hidden">
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-bold shadow-lg",
                  daysUntil <= 7 ? "bg-red-500 text-white" :
                  daysUntil <= 30 ? "bg-amber-500 text-white" :
                  "bg-brand-sky-500 text-white"
                )}>
                  {daysUntil}d
                </span>
              </div>
            )}

            {/* Stats badge - on image */}
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-navy-900/90 backdrop-blur-sm text-white text-xs font-medium shadow-lg">
                <Route className="h-3 w-3 text-brand-sky-400" />
                {formatDistance(distanceMiles, units)}
                {elevationGain && elevationGain > 0 && (
                  <>
                    <span className="text-brand-navy-400 mx-0.5">•</span>
                    <Mountain className="h-3 w-3 text-brand-sky-400" />
                    {formatElevation(elevationGain, units)}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              {/* Header with name and countdown */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-heading font-bold text-brand-navy-900 group-hover:text-brand-sky-600 transition-colors line-clamp-1">
                    {raceName}
                  </h3>
                  <p className="text-sm text-brand-navy-600">{displayName}</p>
                </div>

                {/* Days countdown - desktop */}
                {daysUntil !== null && daysUntil > 0 && !isPast && (
                  <div className="hidden sm:block flex-shrink-0">
                    <span className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-bold",
                      daysUntil <= 7 ? "bg-red-100 text-red-700" :
                      daysUntil <= 30 ? "bg-amber-100 text-amber-700" :
                      "bg-brand-sky-100 text-brand-sky-700"
                    )}>
                      {daysUntil} days
                    </span>
                  </div>
                )}

                {isPast && (
                  <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-sm font-medium bg-brand-navy-100 text-brand-navy-500">
                    Completed
                  </span>
                )}
              </div>

              {/* Meta Info */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-navy-600">
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-brand-sky-500" />
                    <span className="truncate max-w-[150px]">{location}</span>
                  </span>
                )}
                {date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-brand-sky-500" />
                    {date}
                  </span>
                )}
                {goalTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-brand-sky-500" />
                    Goal: {goalTime}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Badges & Arrow */}
            <div className="mt-4 flex items-center justify-between">
              {progressBadges.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {progressBadges.map((badge) => (
                    <span
                      key={badge.label}
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        badge.complete
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-brand-navy-100 text-brand-navy-500"
                      )}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}

              <ChevronRight className="h-5 w-5 text-brand-navy-400 group-hover:text-brand-sky-500 transition-colors flex-shrink-0 ml-auto" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Skeleton loader
export function RacePlanCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-brand-navy-100 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-48 md:w-56 h-32 sm:h-40 bg-brand-navy-100 animate-pulse" />
        <div className="flex-1 p-4 sm:p-5 space-y-3">
          <div className="h-5 bg-brand-navy-100 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-brand-navy-100 rounded animate-pulse w-1/3" />
          <div className="h-4 bg-brand-navy-100 rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  );
}
