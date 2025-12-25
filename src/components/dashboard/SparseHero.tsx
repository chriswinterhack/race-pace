"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Route, MapPin, ChevronRight } from "lucide-react";
import { cn, formatDistance, parseLocalDate, generateGradient } from "@/lib/utils";

interface RacePlan {
  id: string;
  race_distance: {
    distance_miles: number;
    date: string | null;
    race_edition: {
      race: {
        name: string;
        location: string | null;
        hero_image_url: string | null;
      };
    };
  };
}

interface SparseHeroProps {
  nextRace: RacePlan;
  units: "imperial" | "metric";
}

export function SparseHero({ nextRace, units }: SparseHeroProps) {
  const [countdown, setCountdown] = useState({ days: 0 });

  const race = nextRace.race_distance.race_edition.race;
  const distance = nextRace.race_distance;

  // Calculate days until race
  useEffect(() => {
    if (!distance.date) return;

    const targetDate = parseLocalDate(distance.date);
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
      setCountdown({ days });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [distance.date]);

  return (
    <div className="relative -mt-6 lg:-mt-8 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen overflow-hidden">
      <div className="relative h-[320px] sm:h-[280px]">
        {race.hero_image_url ? (
          <Image
            src={race.hero_image_url}
            alt={race.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              generateGradient(race.name)
            )}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-sky-400">
                Your Race
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80">
                {countdown.days} days to go
              </span>
            </div>
            <Link href={`/dashboard/race/${nextRace.id}`} className="group">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-white tracking-tight group-hover:text-brand-sky-200 transition-colors">
                {race.name}
                <ChevronRight className="inline-block h-6 w-6 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-white/70 text-sm">
              {race.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {race.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5" />
                {formatDistance(distance.distance_miles, units)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
