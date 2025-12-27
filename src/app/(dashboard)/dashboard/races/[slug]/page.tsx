"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ExternalLink,
  Mountain,
  Users,
  Bike,
  Footprints,
  Plus,
  Route,
  Flag,
} from "lucide-react";
import {
  Button,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { cn, formatElevation, getDistanceUnit } from "@/lib/utils";
import { formatRaceDate } from "@/lib/utils/race";
import { createClient } from "@/lib/supabase/client";
import { AddToMyRacesModal } from "@/components/race/AddToMyRacesModal";
import { useUnits } from "@/hooks";
import { DiscussionsSection } from "@/components/discussions";
import {
  QuickStat,
  DistanceDetailModal,
  OverviewTab,
  CourseTab,
  CommunityTab,
} from "@/components/race-detail";
import type {
  Race,
  RaceEdition,
  RaceDistance,
  RaceGearStats,
  TabId,
} from "@/types/race-detail";

export default function RaceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [race, setRace] = useState<Race | null>(null);
  const [gearStats, setGearStats] = useState<RaceGearStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedDistance, setSelectedDistance] = useState<RaceDistance | null>(
    null
  );
  const [showGearModal, setShowGearModal] = useState(false);
  const { units } = useUnits();

  const supabase = createClient();

  useEffect(() => {
    if (slug) {
      fetchRace();
    }
  }, [slug]);

  useEffect(() => {
    if (race?.id) {
      fetchGearStats();
    }
  }, [race?.id]);

  async function fetchRace() {
    setLoading(true);
    const { data, error } = await supabase
      .from("races")
      .select(
        `
        id,
        name,
        slug,
        location,
        description,
        website_url,
        hero_image_url,
        race_type,
        race_subtype,
        parking_info,
        weather_notes,
        course_rules,
        course_marking,
        crew_info,
        drop_bag_info,
        race_editions (
          id,
          year,
          registration_opens,
          registration_closes,
          race_distances (
            id,
            name,
            distance_miles,
            date,
            start_time,
            elevation_gain,
            elevation_loss,
            surface_composition,
            aid_stations,
            registration_fee_cents,
            time_limit_minutes
          )
        )
      `
      )
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("Error fetching race:", error);
    } else if (data) {
      const sortedRace = {
        ...data,
        race_editions: (data.race_editions || [])
          .sort((a: RaceEdition, b: RaceEdition) => b.year - a.year)
          .map((edition: RaceEdition) => ({
            ...edition,
            race_distances: (edition.race_distances || []).sort(
              (a: RaceDistance, b: RaceDistance) =>
                b.distance_miles - a.distance_miles
            ),
          })),
      } as Race;
      setRace(sortedRace);
    }
    setLoading(false);
  }

  async function fetchGearStats() {
    if (!race?.id) return;
    try {
      const response = await fetch(`/api/gear/community/${race.id}`);
      const result = await response.json();
      if (result.data) {
        setGearStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch gear stats:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen -mt-6 lg:-mt-8">
        <div className="ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen">
          <Skeleton className="h-[480px] w-full" />
        </div>
        <div className="py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="text-center py-24">
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
          Race not found
        </h1>
        <p className="mt-2 text-brand-navy-600">
          The race you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/dashboard/races">
          <Button className="mt-6">Back to Races</Button>
        </Link>
      </div>
    );
  }

  const latestEdition = race.race_editions[0];
  const allDates =
    latestEdition?.race_distances?.map((d) => d.date).filter(Boolean) || [];
  const firstDate: string | null = allDates.length > 0 ? (allDates.sort()[0] ?? null) : null;
  const totalParticipants = gearStats?.total_participants || 0;

  // Calculate aggregate stats
  const elevations =
    latestEdition?.race_distances
      .map((d) => d.elevation_gain || 0)
      .filter((e) => e > 0) || [];
  const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0;
  const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0;
  const hasElevationRange =
    elevations.length > 1 && minElevation !== maxElevation;
  const distanceRange = latestEdition?.race_distances.length
    ? `${Math.min(...latestEdition.race_distances.map((d) => d.distance_miles))}-${Math.max(...latestEdition.race_distances.map((d) => d.distance_miles))}`
    : null;

  return (
    <div className="min-h-screen -mt-6 lg:-mt-8">
      {/* Hero Section */}
      <HeroSection
        race={race}
        latestEdition={latestEdition}
        firstDate={firstDate}
        onAddToRaces={() => setShowAddModal(true)}
      />

      {/* Quick Stats Bar */}
      <QuickStatsBar
        distanceRange={distanceRange}
        maxElevation={maxElevation}
        hasElevationRange={hasElevationRange}
        latestEdition={latestEdition}
        totalParticipants={totalParticipants}
        units={units}
      />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="py-8 sm:py-12">
        {activeTab === "overview" && (
          <OverviewTab race={race} latestEdition={latestEdition} />
        )}
        {activeTab === "course" && (
          <CourseTab
            latestEdition={latestEdition}
            onDistanceSelect={(d) => setSelectedDistance(d)}
          />
        )}
        {activeTab === "community" && (
          <CommunityTab gearStats={gearStats} raceId={race.id} />
        )}
        {activeTab === "discussions" && (
          <DiscussionsSection raceId={race.id} raceName={race.name} />
        )}
      </div>

      {/* Distance Detail Modal */}
      <Dialog
        open={!!selectedDistance}
        onOpenChange={() => setSelectedDistance(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedDistance && (
            <DistanceDetailModal distance={selectedDistance} />
          )}
        </DialogContent>
      </Dialog>

      {/* Community Gear Modal */}
      <Dialog open={showGearModal} onOpenChange={setShowGearModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Community Gear Choices</DialogTitle>
          </DialogHeader>
          <CommunityTab gearStats={gearStats} raceId={race.id} compact />
        </DialogContent>
      </Dialog>

      {/* Add to My Races Modal */}
      {latestEdition && (
        <AddToMyRacesModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          race={race}
          edition={latestEdition}
        />
      )}
    </div>
  );
}

// Hero Section Component
function HeroSection({
  race,
  latestEdition,
  firstDate,
  onAddToRaces,
}: {
  race: Race;
  latestEdition: RaceEdition | undefined;
  firstDate: string | null;
  onAddToRaces: () => void;
}) {
  return (
    <div className="relative ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen h-[420px] sm:h-[480px] overflow-hidden">
      {/* Background Image */}
      {race.hero_image_url ? (
        <Image
          src={race.hero_image_url}
          alt={race.name}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-800 via-brand-navy-900 to-brand-navy-950">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      {/* Back Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          href="/dashboard/races"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Races
        </Link>
      </div>

      {/* Hero Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12">
        <div className="container mx-auto max-w-7xl px-4 lg:px-6">
          {/* Race Type Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm",
                race.race_type === "bike"
                  ? "bg-brand-sky-500/20 text-brand-sky-200 border border-brand-sky-400/30"
                  : "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
              )}
            >
              {race.race_type === "bike" ? (
                <Bike className="h-4 w-4" />
              ) : (
                <Footprints className="h-4 w-4" />
              )}
              {race.race_subtype
                ? race.race_subtype.charAt(0).toUpperCase() +
                  race.race_subtype.slice(1)
                : race.race_type === "bike"
                  ? "Cycling"
                  : "Running"}
            </span>
            {latestEdition && (
              <span className="text-white/60 text-sm font-medium">
                {latestEdition.year} Edition
              </span>
            )}
          </div>

          {/* Race Name */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white tracking-tight">
            {race.name}
          </h1>

          {/* Location & Date */}
          <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-white/80">
            {race.location && (
              <span className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-white/60" />
                {race.location}
              </span>
            )}
            {firstDate && (
              <span className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-white/60" />
                {formatRaceDate(firstDate)}
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button
              onClick={onAddToRaces}
              size="lg"
              className="gap-2 bg-white text-brand-navy-900 hover:bg-white/90 font-semibold px-6"
            >
              <Plus className="h-5 w-5" />
              Add to My Races
            </Button>
            {race.website_url && (
              <a
                href={race.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium hover:bg-white/20 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Official Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Stats Bar Component
function QuickStatsBar({
  distanceRange,
  maxElevation,
  hasElevationRange,
  latestEdition,
  totalParticipants,
  units,
}: {
  distanceRange: string | null;
  maxElevation: number;
  hasElevationRange: boolean;
  latestEdition: RaceEdition | undefined;
  totalParticipants: number;
  units: "metric" | "imperial";
}) {
  return (
    <div className="ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen bg-brand-navy-900 border-b border-brand-navy-700">
      <div className="container mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-brand-navy-700">
          <QuickStat
            icon={<Route className="h-5 w-5" />}
            label="Distances"
            value={
              distanceRange
                ? `${distanceRange} ${getDistanceUnit(units)}`
                : `${latestEdition?.race_distances.length || 0} options`
            }
          />
          <QuickStat
            icon={<Mountain className="h-5 w-5" />}
            label={hasElevationRange ? "Elevation" : "Elevation Gain"}
            value={
              maxElevation
                ? hasElevationRange
                  ? `Up to ${formatElevation(maxElevation, units)}`
                  : formatElevation(maxElevation, units)
                : "—"
            }
          />
          <QuickStat
            icon={<Flag className="h-5 w-5" />}
            label="Aid Stations"
            value={`${Math.max(...(latestEdition?.race_distances.map((d) => d.aid_stations?.length || 0) || [0]))}`}
          />
          <QuickStat
            icon={<Users className="h-5 w-5" />}
            label="Community"
            value={totalParticipants > 0 ? `${totalParticipants} riders` : "Be first!"}
          />
        </div>
      </div>
    </div>
  );
}

// Tab Navigation Component
function TabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "course", label: "Course & Distances" },
    { id: "community", label: "Community Gear" },
    { id: "discussions", label: "Discussions" },
  ];

  return (
    <div className="sticky top-16 z-20 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen bg-white/80 backdrop-blur-xl border-b border-brand-navy-100">
      <div className="container mx-auto max-w-7xl px-4 lg:px-6">
        <nav className="relative flex gap-1 overflow-x-auto scrollbar-hide py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
                activeTab === tab.id
                  ? "bg-brand-navy-900 text-white shadow-lg"
                  : "text-brand-navy-600 hover:text-brand-navy-900 hover:bg-brand-navy-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
