"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Calendar,
  MapPin,
  Route,
  Clock,
  ChevronRight,
  TrendingUp,
  Bike,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/calculations";
import { AddRaceModal } from "@/components/race/AddRaceModal";

// Parse date string as local time to avoid timezone issues
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

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

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    // Fetch race plans with race details
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
              location
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

    // Fetch athlete profile
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

  // Separate upcoming and past races, sorted by date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates only, not times

  const upcomingRaces = racePlans
    .filter((plan) => {
      const raceDate = plan.race_distance?.date ? parseLocalDate(plan.race_distance.date) : null;
      return !raceDate || raceDate >= today;
    })
    .sort((a, b) => {
      // Sort by date ascending (soonest first), races without dates go last
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
      // Sort by date descending (most recent first)
      const dateA = a.race_distance?.date ? parseLocalDate(a.race_distance.date).getTime() : 0;
      const dateB = b.race_distance?.date ? parseLocalDate(b.race_distance.date).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-navy-900 sm:text-3xl">
            My Races
          </h1>
          <p className="mt-2 text-brand-navy-600">
            Plan and prepare for your upcoming events
          </p>
        </div>
        <Button onClick={() => setShowAddRace(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Race
        </Button>
      </div>

      {/* Profile reminder if not set up */}
      {!loading && athleteProfile && (!athleteProfile.ftp_watts || !athleteProfile.weight_kg) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-900">Complete your profile</p>
                <p className="text-sm text-amber-700">
                  Add your FTP and weight to get personalized power targets
                </p>
              </div>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                Set Up Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && racePlans.length === 0 && (
        <Card className="border-dashed border-2 border-brand-navy-200">
          <CardContent className="py-12 text-center">
            <div className="p-4 rounded-full bg-brand-navy-100 inline-flex mb-4">
              <Route className="h-8 w-8 text-brand-navy-400" />
            </div>
            <h2 className="text-lg font-semibold text-brand-navy-900">
              No races yet
            </h2>
            <p className="mt-2 text-brand-navy-600 max-w-sm mx-auto">
              Add your first race to start building your plan with pacing, power targets, and nutrition strategy.
            </p>
            <Button onClick={() => setShowAddRace(true)} className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Race
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Races */}
      {!loading && upcomingRaces.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-semibold text-brand-navy-900">
            Upcoming Races
          </h2>
          <div className="grid gap-4">
            {upcomingRaces.map((plan) => (
              <RaceCard key={plan.id} plan={plan} athleteProfile={athleteProfile} />
            ))}
          </div>
        </div>
      )}

      {/* Past Races */}
      {!loading && pastRaces.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-semibold text-brand-navy-500">
            Past Races
          </h2>
          <div className="grid gap-4 opacity-75">
            {pastRaces.map((plan) => (
              <RaceCard key={plan.id} plan={plan} athleteProfile={athleteProfile} isPast />
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Active Plans"
            value={upcomingRaces.length.toString()}
            icon={Route}
            href="/dashboard"
          />
          <StatCard
            label="FTP"
            value={athleteProfile?.ftp_watts?.toString() || "—"}
            suffix="w"
            icon={TrendingUp}
            href="/dashboard/settings"
          />
          <StatCard
            label="Weight"
            value={athleteProfile?.weight_kg?.toString() || "—"}
            suffix="kg"
            icon={Bike}
            href="/dashboard/settings"
          />
          <StatCard
            label="Completed"
            value={pastRaces.length.toString()}
            icon={Calendar}
            href="/dashboard"
          />
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

interface RaceCardProps {
  plan: RacePlan;
  athleteProfile: AthleteProfile | null;
  isPast?: boolean;
}

function RaceCard({ plan, athleteProfile, isPast }: RaceCardProps) {
  const distance = plan.race_distance;
  const race = distance?.race_edition?.race;

  if (!distance || !race) return null;

  const displayName = distance.name
    ? `${distance.name} (${distance.distance_miles} mi)`
    : `${distance.distance_miles} mi`;

  const daysUntil = distance.date
    ? Math.ceil((parseLocalDate(distance.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link href={`/dashboard/race/${plan.id}`}>
      <Card className={cn(
        "hover:shadow-elevated hover:border-brand-sky-300 transition-all cursor-pointer group",
        isPast && "bg-brand-navy-50"
      )}>
        <CardContent className="p-0">
          <div className="flex items-center">
            {/* Race Info */}
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-brand-navy-900 group-hover:text-brand-sky-600 transition-colors">
                    {race.name}
                  </h3>
                  <p className="text-brand-navy-600">{displayName}</p>
                </div>
                {daysUntil !== null && daysUntil > 0 && !isPast && (
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    daysUntil <= 7 ? "bg-red-100 text-red-700" :
                    daysUntil <= 30 ? "bg-amber-100 text-amber-700" :
                    "bg-brand-sky-100 text-brand-sky-700"
                  )}>
                    {daysUntil} days
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-brand-navy-600">
                {race.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {race.location}
                  </span>
                )}
                {distance.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {parseLocalDate(distance.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                {plan.goal_time_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Goal: {formatDuration(plan.goal_time_minutes)}
                  </span>
                )}
              </div>

              {/* Progress indicators */}
              <div className="mt-4 flex items-center gap-3">
                <ProgressBadge label="Pacing" complete={!!plan.goal_time_minutes} />
                <ProgressBadge label="Power" complete={!!athleteProfile?.ftp_watts} />
                <ProgressBadge label="Nutrition" complete={false} />
                <ProgressBadge label="Gear" complete={false} />
              </div>
            </div>

            {/* Chevron */}
            <div className="pr-5">
              <ChevronRight className="h-5 w-5 text-brand-navy-400 group-hover:text-brand-sky-500 transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProgressBadge({ label, complete }: { label: string; complete: boolean }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-xs font-medium",
      complete
        ? "bg-emerald-100 text-emerald-700"
        : "bg-brand-navy-100 text-brand-navy-500"
    )}>
      {label}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ElementType;
  href: string;
}

function StatCard({ label, value, suffix, icon: Icon, href }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-elevated transition-shadow cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-brand-navy-600">{label}</p>
              <p className="mt-1 text-2xl font-bold text-brand-navy-900 font-mono tabular-nums">
                {value}
                {suffix && value !== "—" && (
                  <span className="text-lg text-brand-navy-500 ml-0.5">{suffix}</span>
                )}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-brand-sky-50">
              <Icon className="h-5 w-5 text-brand-sky-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
