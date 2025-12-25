"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Route,
  TrendingUp,
  Zap,
  Settings,
  ArrowRight,
  Target,
} from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { parseLocalDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/calculations";
import { AddRaceModal } from "@/components/race/AddRaceModal";
import { RacePlanCard, RacePlanCardSkeleton } from "@/components/race/RacePlanCard";
import { useUnits } from "@/hooks";
import {
  QuickStatPill,
  FeaturedRaceCard,
  DashboardHero,
  EmptyStateHero,
  SparseHero,
  type FeaturedRace,
} from "@/components/dashboard";

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
  const [featuredRaces, setFeaturedRaces] = useState<FeaturedRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRace, setShowAddRace] = useState(false);
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

    // Fetch featured/available races for discovery
    const { data: races } = await supabase
      .from("races")
      .select(`
        id,
        name,
        slug,
        location,
        hero_image_url,
        race_subtype,
        race_type,
        race_editions (
          id,
          year,
          race_distances (
            id,
            name,
            distance_miles,
            date,
            elevation_gain
          )
        )
      `)
      .eq("is_active", true)
      .order("name");

    if (races) {
      // Filter to only races with upcoming dates and get participant counts
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingRaces = races.filter((race: FeaturedRace) => {
        const hasUpcomingEdition = race.race_editions?.some((edition) =>
          edition.race_distances?.some((dist) => {
            if (!dist.date) return true;
            const raceDate = parseLocalDate(dist.date);
            return raceDate >= today;
          })
        );
        return hasUpcomingEdition;
      });

      // Get participant counts
      const { data: counts } = await supabase
        .from("race_plans")
        .select("race_distance:race_distances(race_edition:race_editions(race_id))")
        .not("race_distance", "is", null);

      const countMap = new Map<string, number>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      counts?.forEach((plan: any) => {
        const raceId = plan.race_distance?.race_edition?.race_id;
        if (raceId) {
          countMap.set(raceId, (countMap.get(raceId) || 0) + 1);
        }
      });

      const racesWithCounts = upcomingRaces.map((race: FeaturedRace) => ({
        ...race,
        participant_count: countMap.get(race.id) || 0,
      }));

      // Sort by participant count (most popular first), then by date
      racesWithCounts.sort((a: FeaturedRace, b: FeaturedRace) => {
        if ((b.participant_count || 0) !== (a.participant_count || 0)) {
          return (b.participant_count || 0) - (a.participant_count || 0);
        }
        const getEarliestDate = (race: FeaturedRace) => {
          let earliest = Infinity;
          race.race_editions?.forEach((ed) => {
            ed.race_distances?.forEach((dist) => {
              if (dist.date) {
                const d = parseLocalDate(dist.date).getTime();
                if (d < earliest) earliest = d;
              }
            });
          });
          return earliest;
        };
        return getEarliestDate(a) - getEarliestDate(b);
      });

      setFeaturedRaces(racesWithCounts);
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
      if (!plan.race_distance?.race_edition?.race) return false;
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
      if (!plan.race_distance?.race_edition?.race) return false;
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
      completed: items.filter((i) => i.complete).length,
      total: items.length,
      items,
    };
  };

  const prep = getPreparationProgress();

  // Get races the user hasn't added yet
  const userRaceIds = new Set(
    racePlans.map((p) => p.race_distance?.race_edition?.race?.id).filter(Boolean)
  );
  const discoverableRaces = featuredRaces.filter((r) => !userRaceIds.has(r.id));

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="relative -mt-6 lg:-mt-8 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen h-[400px] bg-brand-navy-100 animate-pulse" />
        <div className="space-y-4 pt-4">
          <RacePlanCardSkeleton />
          <RacePlanCardSkeleton />
        </div>
      </div>
    );
  }

  // Empty state - no races OR sparse state (only 1 race)
  if (racePlans.length <= 1) {
    return (
      <div className="space-y-8 pb-8">
        {/* If user has 1 race, show sparse hero */}
        {nextRace && nextRace.race_distance?.race_edition?.race && (
          <SparseHero nextRace={nextRace} units={units} />
        )}

        {/* If no races, show empty state hero */}
        {racePlans.length === 0 && <EmptyStateHero onAddRaceClick={() => setShowAddRace(true)} />}

        {/* Profile Setup CTA */}
        <ProfileSetupCard athleteProfile={athleteProfile} />

        {/* Featured Races Section */}
        {discoverableRaces.length > 0 && (
          <FeaturedRacesSection
            races={discoverableRaces}
            units={units}
            hasRaces={racePlans.length > 0}
            onAddClick={() => setShowAddRace(true)}
          />
        )}

        {/* Quick Stats - Only show if user has 1 race */}
        {racePlans.length === 1 && (
          <QuickStatsBar
            upcomingCount={upcomingRaces.length}
            completedCount={pastRaces.length}
            athleteProfile={athleteProfile}
          />
        )}

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
      {/* Hero Section */}
      {nextRace && nextRace.race_distance?.race_edition?.race && (
        <DashboardHero
          nextRace={nextRace}
          units={units}
          preparation={prep}
          onAddRaceClick={() => setShowAddRace(true)}
        />
      )}

      {/* Quick Stats Bar */}
      <QuickStatsBar
        upcomingCount={upcomingRaces.length}
        completedCount={pastRaces.length}
        athleteProfile={athleteProfile}
      />

      {/* Profile Setup Reminder */}
      <ProfileSetupCard athleteProfile={athleteProfile} />

      {/* Other Upcoming Races */}
      {otherUpcomingRaces.length > 0 && (
        <UpcomingRacesSection
          races={otherUpcomingRaces}
          athleteProfile={athleteProfile}
        />
      )}

      {/* Past Races */}
      {pastRaces.length > 0 && (
        <PastRacesSection races={pastRaces} />
      )}

      <AddRaceModal
        open={showAddRace}
        onClose={() => setShowAddRace(false)}
        onRaceAdded={handleRaceAdded}
      />
    </div>
  );
}

// Sub-components

function QuickStatsBar({
  upcomingCount,
  completedCount,
  athleteProfile,
}: {
  upcomingCount: number;
  completedCount: number;
  athleteProfile: AthleteProfile | null;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <QuickStatPill icon={Route} label="Upcoming" value={upcomingCount.toString()} color="sky" />
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
      <QuickStatPill icon={Calendar} label="Completed" value={completedCount.toString()} color="purple" />
    </div>
  );
}

function ProfileSetupCard({ athleteProfile }: { athleteProfile: AthleteProfile | null }) {
  if (!athleteProfile || (athleteProfile.ftp_watts && athleteProfile.weight_kg)) {
    return null;
  }

  return (
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
  );
}

function FeaturedRacesSection({
  races,
  units,
  hasRaces,
  onAddClick,
}: {
  races: FeaturedRace[];
  units: "imperial" | "metric";
  hasRaces: boolean;
  onAddClick: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-brand-navy-900">
            {hasRaces ? "Add Another Race" : "Popular Races"}
          </h2>
          <p className="text-sm text-brand-navy-500 mt-1">
            {hasRaces ? "Expand your race calendar" : "Start planning with one of these top events"}
          </p>
        </div>
        <Link href="/dashboard/races">
          <Button variant="ghost" className="gap-2 text-brand-navy-600 hover:text-brand-navy-900">
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="relative -mx-6 px-6 lg:mx-0 lg:px-0">
        <div className="flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 snap-x snap-mandatory lg:snap-none scrollbar-hide">
          {races.slice(0, 6).map((race, index) => (
            <FeaturedRaceCard
              key={race.id}
              race={race}
              index={index}
              units={units}
              onAddClick={onAddClick}
            />
          ))}
        </div>
      </div>

      {races.length > 6 && (
        <div className="text-center">
          <Link href="/dashboard/races">
            <Button variant="outline" className="gap-2">
              See {races.length - 6} more races
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function UpcomingRacesSection({
  races,
  athleteProfile,
}: {
  races: RacePlan[];
  athleteProfile: AthleteProfile | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold text-brand-navy-900">More Upcoming Races</h2>
        <Link href="/dashboard/races" className="text-sm text-brand-sky-600 hover:text-brand-sky-700 font-medium">
          Browse all races →
        </Link>
      </div>
      <div className="grid gap-4">
        {races.map((plan) => {
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
  );
}

function PastRacesSection({ races }: { races: RacePlan[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold text-brand-navy-500">Past Races</h2>
      <div className="grid gap-4">
        {races.slice(0, 3).map((plan) => {
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
      {races.length > 3 && (
        <p className="text-sm text-center text-brand-navy-500">
          + {races.length - 3} more past {races.length - 3 === 1 ? "race" : "races"}
        </p>
      )}
    </div>
  );
}
