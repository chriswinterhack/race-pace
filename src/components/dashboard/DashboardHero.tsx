"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Route,
  MapPin,
  Mountain,
  ChevronRight,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn, formatDistance, formatElevation, parseLocalDate, generateGradient } from "@/lib/utils";
import { formatDuration } from "@/lib/calculations";
import { CountdownUnit } from "./CountdownUnit";

interface RacePlan {
  id: string;
  goal_time_minutes: number | null;
  race_distance: {
    distance_miles: number;
    date: string | null;
    elevation_gain: number | null;
    race_edition: {
      race: {
        name: string;
        location: string | null;
        hero_image_url: string | null;
        race_subtype: string | null;
      };
    };
  };
}

interface PreparationItem {
  label: string;
  complete: boolean;
  icon: React.ElementType;
}

interface DashboardHeroProps {
  nextRace: RacePlan;
  units: "imperial" | "metric";
  preparation: {
    completed: number;
    total: number;
    items: PreparationItem[];
  };
  onAddRaceClick: () => void;
}

export function DashboardHero({
  nextRace,
  units,
  preparation,
  onAddRaceClick,
}: DashboardHeroProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const race = nextRace.race_distance.race_edition.race;
  const distance = nextRace.race_distance;
  const prepPercent = (preparation.completed / preparation.total) * 100;

  // Live countdown timer
  useEffect(() => {
    if (!distance.date) return;

    const targetDate = parseLocalDate(distance.date);

    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [distance.date]);

  return (
    <div className="relative -mt-6 lg:-mt-8 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen overflow-hidden">
      {/* Background Image */}
      <div className="relative h-[420px] sm:h-[380px]">
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
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto w-full">
            {/* Top Bar - Quick Actions */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <Button
                onClick={onAddRaceClick}
                size="sm"
                className="gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Race</span>
              </Button>
            </div>

            {/* Label */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-sky-400">
                Next Race
              </span>
              {race.race_subtype && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80 backdrop-blur-sm">
                  {race.race_subtype}
                </span>
              )}
            </div>

            {/* Race Name */}
            <Link href={`/dashboard/race/${nextRace.id}`} className="group">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white tracking-tight group-hover:text-brand-sky-200 transition-colors">
                {race.name}
                <ChevronRight className="inline-block h-8 w-8 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            </Link>

            {/* Meta Info */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-white/70">
              {race.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {race.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Route className="h-4 w-4" />
                {formatDistance(distance.distance_miles, units)}
              </span>
              {distance.elevation_gain && (
                <span className="flex items-center gap-1.5">
                  <Mountain className="h-4 w-4" />
                  {formatElevation(distance.elevation_gain, units)}
                </span>
              )}
              {nextRace.goal_time_minutes && (
                <span className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-brand-sky-400" />
                  <span className="text-white">
                    Goal: {formatDuration(nextRace.goal_time_minutes)}
                  </span>
                </span>
              )}
            </div>

            {/* Countdown Timer */}
            <div className="mt-6 flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-baseline gap-1">
                {countdown.days > 0 && (
                  <CountdownUnit value={countdown.days} label="days" />
                )}
                <CountdownUnit value={countdown.hours} label="hrs" />
                <CountdownUnit value={countdown.minutes} label="min" />
                <CountdownUnit value={countdown.seconds} label="sec" small />
              </div>

              {/* Preparation Progress Ring */}
              <div className="flex items-center gap-4 bg-black/30 backdrop-blur-sm rounded-xl p-3 pr-5">
                <div className="relative w-14 h-14">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="stroke-white/20"
                      strokeWidth="3"
                      fill="none"
                      r="15.5"
                      cx="18"
                      cy="18"
                    />
                    <circle
                      className="stroke-brand-sky-400 transition-all duration-500"
                      strokeWidth="3"
                      fill="none"
                      r="15.5"
                      cx="18"
                      cy="18"
                      strokeDasharray={`${prepPercent}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {preparation.completed}/{preparation.total}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider">
                    Prep Status
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {preparation.completed === preparation.total
                      ? "Ready to Race!"
                      : `${preparation.total - preparation.completed} items left`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
