"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Calendar,
  Route,
  TrendingUp,
  MapPin,
  Mountain,
  ChevronRight,
  Zap,
  Target,
  Settings,
  Compass,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
} from "@/components/ui";
import { cn, formatDistance, formatElevation, parseLocalDate, generateGradient } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/calculations";
import { AddRaceModal } from "@/components/race/AddRaceModal";
import { RacePlanCard, RacePlanCardSkeleton } from "@/components/race/RacePlanCard";
import { useUnits } from "@/hooks";

interface RacePlan {
  id: string;
  goal_time_minutes: number | null;
  status: string;
  created_at: string;
  race_distance: {
    id: string;
    name: string | null;
    distance_miles: number;
    date: string | null;
    elevation_gain: number | null;
    race_edition: {
      year: number;
      race: {
        id: string;
        name: string;
        location: string | null;
        hero_image_url: string | null;
        race_subtype: string | null;
      };
    };
  };
}

interface AthleteProfile {
  ftp_watts: number | null;
  weight_kg: number | null;
}

export default function DashboardPage() {
  const [racePlans, setRacePlans] = useState<RacePlan[]>([]);
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddRace, setShowAddRace] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { units } = useUnits();

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: plans, error: plansError } = await supabase
      .from("race_plans")
      .select(`
        id,
        goal_time_minutes,
        status,
        created_at,
        race_distance:race_distances (
          id,
          name,
          distance_miles,
          date,
          elevation_gain,
          race_edition:race_editions (
            year,
            race:races (
              id,
              name,
              location,
              hero_image_url,
              race_subtype
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (plansError) {
      console.error("Error fetching race plans:", plansError);
    } else {
      setRacePlans((plans || []) as unknown as RacePlan[]);
    }

    const { data: profile } = await supabase
      .from("athlete_profiles")
      .select("ftp_watts, weight_kg")
      .single();

    if (profile) {
      setAthleteProfile(profile);
    }

    setLoading(false);
  }

  const handleRaceAdded = () => {
    setShowAddRace(false);
    fetchData();
  };

  // Separate upcoming and past races
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingRaces = racePlans
    .filter((plan) => {
      const raceDate = plan.race_distance?.date ? parseLocalDate(plan.race_distance.date) : null;
      return !raceDate || raceDate >= today;
    })
    .sort((a, b) => {
      const dateA = a.race_distance?.date ? parseLocalDate(a.race_distance.date).getTime() : Infinity;
      const dateB = b.race_distance?.date ? parseLocalDate(b.race_distance.date).getTime() : Infinity;
      return dateA - dateB;
    });

  const pastRaces = racePlans
    .filter((plan) => {
      const raceDate = plan.race_distance?.date ? parseLocalDate(plan.race_distance.date) : null;
      return raceDate && raceDate < today;
    })
    .sort((a, b) => {
      const dateA = a.race_distance?.date ? parseLocalDate(a.race_distance.date).getTime() : 0;
      const dateB = b.race_distance?.date ? parseLocalDate(b.race_distance.date).getTime() : 0;
      return dateB - dateA;
    });

  const nextRace = upcomingRaces[0];
  const otherUpcomingRaces = upcomingRaces.slice(1);

  // Live countdown timer
  useEffect(() => {
    if (!nextRace?.race_distance?.date) return;

    const targetDate = parseLocalDate(nextRace.race_distance.date);

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
  }, [nextRace?.race_distance?.date]);

  // Calculate preparation progress
  const getPreparationProgress = () => {
    if (!nextRace) return { completed: 0, total: 4, items: [] };

    const items = [
      { label: "Goal Time", complete: !!nextRace.goal_time_minutes, icon: Target },
      { label: "Power Zones", complete: !!athleteProfile?.ftp_watts, icon: Zap },
      { label: "Weight Set", complete: !!athleteProfile?.weight_kg, icon: TrendingUp },
      { label: "Race Added", complete: true, icon: Route },
    ];

    return {
      completed: items.filter(i => i.complete).length,
      total: items.length,
      items,
    };
  };

  const prep = getPreparationProgress();
  const prepPercent = (prep.completed / prep.total) * 100;

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Hero Skeleton */}
        <div className="relative -mt-6 lg:-mt-8 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen h-[400px] bg-brand-navy-100 animate-pulse" />
        <div className="space-y-4 pt-4">
          <RacePlanCardSkeleton />
          <RacePlanCardSkeleton />
        </div>
      </div>
    );
  }

  // Empty state - no races
  if (racePlans.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col">
        {/* Dramatic Empty State - Full viewport width */}
        <div className="flex-1 flex items-center justify-center -mt-6 lg:-mt-8 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-sky-900">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-6 py-16 max-w-2xl mx-auto">
            {/* Animated Icon */}
            <div className="relative inline-flex mb-8">
              <div className="absolute inset-0 bg-brand-sky-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative p-6 rounded-full bg-gradient-to-br from-brand-sky-500 to-brand-sky-600 shadow-2xl shadow-brand-sky-500/30">
                <Compass className="h-12 w-12 text-white" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4 tracking-tight">
              Your Race HQ Awaits
            </h1>
            <p className="text-xl text-brand-sky-200 mb-8 leading-relaxed">
              Add your first race to unlock personalized pacing, power targets, and nutrition strategies.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setShowAddRace(true)}
                size="lg"
                className="gap-2 bg-white text-brand-navy-900 hover:bg-brand-sky-50 font-semibold px-8 py-6 text-lg shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Add Your First Race
              </Button>
              <Link href="/dashboard/races">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
                >
                  <Route className="h-5 w-5" />
                  Browse Races
                </Button>
              </Link>
            </div>

            {/* Quick Setup Reminder */}
            {athleteProfile && (!athleteProfile.ftp_watts || !athleteProfile.weight_kg) && (
              <div className="mt-12 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 inline-flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-brand-sky-300" />
                <span className="text-brand-sky-100">
                  Set up your <Link href="/dashboard/settings" className="text-white font-medium underline underline-offset-2">athlete profile</Link> for personalized targets
                </span>
              </div>
            )}
          </div>
        </div>

        <AddRaceModal
          open={showAddRace}
          onClose={() => setShowAddRace(false)}
          onRaceAdded={handleRaceAdded}
        />
      </div>
    );
  }

  // Main dashboard with races
  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section - Next Race Countdown - Full viewport width */}
      {nextRace && (
        <div className="relative -mt-6 lg:-mt-8 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen overflow-hidden">
          {/* Background Image */}
          <div className="relative h-[420px] sm:h-[380px]">
            {nextRace.race_distance.race_edition.race.hero_image_url ? (
              <Image
                src={nextRace.race_distance.race_edition.race.hero_image_url}
                alt={nextRace.race_distance.race_edition.race.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br",
                generateGradient(nextRace.race_distance.race_edition.race.name)
              )}>
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
                    onClick={() => setShowAddRace(true)}
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
                  {nextRace.race_distance.race_edition.race.race_subtype && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80 backdrop-blur-sm">
                      {nextRace.race_distance.race_edition.race.race_subtype}
                    </span>
                  )}
                </div>

                {/* Race Name */}
                <Link href={`/dashboard/race/${nextRace.id}`} className="group">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white tracking-tight group-hover:text-brand-sky-200 transition-colors">
                    {nextRace.race_distance.race_edition.race.name}
                    <ChevronRight className="inline-block h-8 w-8 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h1>
                </Link>

                {/* Meta Info */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-white/70">
                  {nextRace.race_distance.race_edition.race.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {nextRace.race_distance.race_edition.race.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Route className="h-4 w-4" />
                    {formatDistance(nextRace.race_distance.distance_miles, units)}
                  </span>
                  {nextRace.race_distance.elevation_gain && (
                    <span className="flex items-center gap-1.5">
                      <Mountain className="h-4 w-4" />
                      {formatElevation(nextRace.race_distance.elevation_gain, units)}
                    </span>
                  )}
                  {nextRace.goal_time_minutes && (
                    <span className="flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-brand-sky-400" />
                      <span className="text-white">Goal: {formatDuration(nextRace.goal_time_minutes)}</span>
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
                        <span className="text-sm font-bold text-white">{prep.completed}/{prep.total}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 uppercase tracking-wider">Prep Status</p>
                      <p className="text-sm font-semibold text-white">
                        {prep.completed === prep.total ? "Ready to Race!" : `${prep.total - prep.completed} items left`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStatPill
          icon={Route}
          label="Upcoming"
          value={upcomingRaces.length.toString()}
          color="sky"
        />
        <QuickStatPill
          icon={Zap}
          label="FTP"
          value={athleteProfile?.ftp_watts?.toString() || "—"}
          suffix="w"
          color="amber"
          href="/dashboard/settings"
        />
        <QuickStatPill
          icon={TrendingUp}
          label="W/kg"
          value={
            athleteProfile?.ftp_watts && athleteProfile?.weight_kg
              ? (athleteProfile.ftp_watts / athleteProfile.weight_kg).toFixed(2)
              : "—"
          }
          color="emerald"
          href="/dashboard/settings"
        />
        <QuickStatPill
          icon={Calendar}
          label="Completed"
          value={pastRaces.length.toString()}
          color="purple"
        />
      </div>

      {/* Profile Setup Reminder */}
      {athleteProfile && (!athleteProfile.ftp_watts || !athleteProfile.weight_kg) && (
        <Card className="border-brand-sky-200 bg-gradient-to-r from-brand-sky-50 to-brand-navy-50 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-xl bg-brand-sky-100">
                <TrendingUp className="h-6 w-6 text-brand-sky-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-brand-navy-900">Complete your athlete profile</p>
                <p className="text-sm text-brand-navy-600">
                  Add your FTP and weight to unlock personalized power targets
                </p>
              </div>
              <Link href="/dashboard/settings">
                <Button className="gap-2">
                  <Settings className="h-4 w-4" />
                  Set Up
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Upcoming Races */}
      {otherUpcomingRaces.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-brand-navy-900">
              More Upcoming Races
            </h2>
            <Link href="/dashboard/races" className="text-sm text-brand-sky-600 hover:text-brand-sky-700 font-medium">
              Browse all races →
            </Link>
          </div>
          <div className="grid gap-4">
            {otherUpcomingRaces.map((plan) => {
              const distance = plan.race_distance;
              const race = distance?.race_edition?.race;
              if (!distance || !race) return null;

              const daysUntil = distance.date
                ? Math.ceil((parseLocalDate(distance.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              const formattedDate = distance.date
                ? parseLocalDate(distance.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;

              return (
                <RacePlanCard
                  key={plan.id}
                  planId={plan.id}
                  raceName={race.name}
                  location={race.location}
                  heroImageUrl={race.hero_image_url}
                  distanceName={distance.name}
                  distanceMiles={distance.distance_miles}
                  elevationGain={distance.elevation_gain}
                  date={formattedDate}
                  goalTime={plan.goal_time_minutes ? formatDuration(plan.goal_time_minutes) : null}
                  daysUntil={daysUntil}
                  progressBadges={[
                    { label: "Pacing", complete: !!plan.goal_time_minutes },
                    { label: "Power", complete: !!athleteProfile?.ftp_watts },
                  ]}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Past Races */}
      {pastRaces.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-semibold text-brand-navy-500">
            Past Races
          </h2>
          <div className="grid gap-4">
            {pastRaces.slice(0, 3).map((plan) => {
              const distance = plan.race_distance;
              const race = distance?.race_edition?.race;
              if (!distance || !race) return null;

              const formattedDate = distance.date
                ? parseLocalDate(distance.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;

              return (
                <RacePlanCard
                  key={plan.id}
                  planId={plan.id}
                  raceName={race.name}
                  location={race.location}
                  heroImageUrl={race.hero_image_url}
                  distanceName={distance.name}
                  distanceMiles={distance.distance_miles}
                  elevationGain={distance.elevation_gain}
                  date={formattedDate}
                  goalTime={plan.goal_time_minutes ? formatDuration(plan.goal_time_minutes) : null}
                  daysUntil={null}
                  isPast
                />
              );
            })}
          </div>
          {pastRaces.length > 3 && (
            <p className="text-sm text-center text-brand-navy-500">
              + {pastRaces.length - 3} more past {pastRaces.length - 3 === 1 ? "race" : "races"}
            </p>
          )}
        </div>
      )}

      {/* Add Race Modal */}
      <AddRaceModal
        open={showAddRace}
        onClose={() => setShowAddRace(false)}
        onRaceAdded={handleRaceAdded}
      />
    </div>
  );
}

// Countdown Unit Component
function CountdownUnit({
  value,
  label,
  small = false,
}: {
  value: number;
  label: string;
  small?: boolean;
}) {
  return (
    <div className={cn("text-center", small ? "opacity-70" : "")}>
      <div className={cn(
        "font-mono font-bold text-white tabular-nums",
        small ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl lg:text-6xl"
      )}>
        {value.toString().padStart(2, "0")}
      </div>
      <div className={cn(
        "text-white/60 uppercase tracking-wider",
        small ? "text-[10px]" : "text-xs"
      )}>
        {label}
      </div>
    </div>
  );
}

// Quick Stat Pill Component
function QuickStatPill({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  suffix?: string;
  color: "sky" | "amber" | "emerald" | "purple";
  href?: string;
}) {
  const colorClasses = {
    sky: "bg-brand-sky-50 border-brand-sky-200 hover:border-brand-sky-300",
    amber: "bg-amber-50 border-amber-200 hover:border-amber-300",
    emerald: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
    purple: "bg-purple-50 border-purple-200 hover:border-purple-300",
  };

  const iconColors = {
    sky: "text-brand-sky-500",
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    purple: "text-purple-500",
  };

  const content = (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-colors",
      colorClasses[color],
      href && "cursor-pointer"
    )}>
      <Icon className={cn("h-5 w-5", iconColors[color])} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-brand-navy-500 truncate">{label}</p>
        <p className="text-lg font-bold text-brand-navy-900 font-mono tabular-nums">
          {value}
          {suffix && value !== "—" && (
            <span className="text-sm text-brand-navy-400 ml-0.5">{suffix}</span>
          )}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
