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
  Clock,
  Flag,
  Plus,
  ChevronRight,
  Route,
  Thermometer,
  Car,
  TrendingUp,
  Circle,
  Timer,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import {
  cn,
  formatDistance,
  formatElevation,
  getDistanceUnit,
  parseLocalDate,
  formatDateShort,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { AddToMyRacesModal } from "@/components/race/AddToMyRacesModal";
import { useUnits } from "@/hooks";
import { DiscussionsSection } from "@/components/discussions";
import { formatDuration } from "@/lib/calculations";

function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}


function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours!, minutes!, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface AidStation {
  name: string;
  mile: number;
  supplies?: string[];
  cutoff_time?: string;
  type?: "aid_station" | "checkpoint";
}

interface SurfaceComposition {
  gravel?: number;
  pavement?: number;
  singletrack?: number;
  doubletrack?: number;
  dirt?: number;
}

interface RaceDistance {
  id: string;
  name: string | null;
  distance_miles: number;
  date: string | null;
  start_time: string | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  surface_composition: SurfaceComposition | null;
  aid_stations: AidStation[] | null;
  registration_fee_cents: number | null;
  time_limit_minutes: number | null;
}

interface RaceEdition {
  id: string;
  year: number;
  registration_opens: string | null;
  registration_closes: string | null;
  race_distances: RaceDistance[];
}

interface Race {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  website_url: string | null;
  hero_image_url: string | null;
  race_type: "bike" | "run";
  race_subtype: string;
  parking_info: string | null;
  weather_notes: string | null;
  course_rules: string | null;
  course_marking: string | null;
  crew_info: string | null;
  drop_bag_info: string | null;
  race_editions: RaceEdition[];
}

interface GearAggregation {
  brand: string;
  model: string;
  width?: string; // For tires: "2.4"" or "40mm"
  count: number;
  percentage: number;
}

interface RaceGearStats {
  total_participants: number;
  bikes: GearAggregation[];
  front_tires: GearAggregation[];
  rear_tires: GearAggregation[];
}

type TabId = "overview" | "course" | "community" | "discussions";

export default function RaceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [race, setRace] = useState<Race | null>(null);
  const [gearStats, setGearStats] = useState<RaceGearStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedDistance, setSelectedDistance] = useState<RaceDistance | null>(null);
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
      .select(`
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
      `)
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
              (a: RaceDistance, b: RaceDistance) => b.distance_miles - a.distance_miles
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
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900">Race not found</h1>
        <p className="mt-2 text-brand-navy-600">The race you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard/races">
          <Button className="mt-6">Back to Races</Button>
        </Link>
      </div>
    );
  }

  const latestEdition = race.race_editions[0];
  const allDates = latestEdition?.race_distances?.map((d) => d.date).filter(Boolean) || [];
  const firstDate = allDates.length > 0 ? allDates.sort()[0] : null;
  const totalParticipants = gearStats?.total_participants || 0;

  // Calculate aggregate stats
  const elevations = latestEdition?.race_distances.map((d) => d.elevation_gain || 0).filter(e => e > 0) || [];
  const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0;
  const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0;
  const hasElevationRange = elevations.length > 1 && minElevation !== maxElevation;
  const distanceRange = latestEdition?.race_distances.length
    ? `${Math.min(...latestEdition.race_distances.map((d) => d.distance_miles))}-${Math.max(...latestEdition.race_distances.map((d) => d.distance_miles))}`
    : null;

  return (
    <div className="min-h-screen -mt-6 lg:-mt-8">
      {/* Hero Section - Full viewport width */}
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
            {/* Pattern overlay for non-image heroes */}
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
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm",
                race.race_type === "bike"
                  ? "bg-brand-sky-500/20 text-brand-sky-200 border border-brand-sky-400/30"
                  : "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
              )}>
                {race.race_type === "bike" ? (
                  <Bike className="h-4 w-4" />
                ) : (
                  <Footprints className="h-4 w-4" />
                )}
                {race.race_subtype
                  ? race.race_subtype.charAt(0).toUpperCase() + race.race_subtype.slice(1)
                  : race.race_type === "bike" ? "Cycling" : "Running"}
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
                  {formatDate(firstDate)}
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button
                onClick={() => setShowAddModal(true)}
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

      {/* Quick Stats Bar - Full viewport width */}
      <div className="ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen bg-brand-navy-900 border-b border-brand-navy-700">
        <div className="container mx-auto max-w-7xl px-4 lg:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-brand-navy-700">
            <QuickStat
              icon={<Route className="h-5 w-5" />}
              label="Distances"
              value={distanceRange ? `${distanceRange} ${getDistanceUnit(units)}` : `${latestEdition?.race_distances.length || 0} options`}
            />
            <QuickStat
              icon={<Mountain className="h-5 w-5" />}
              label={hasElevationRange ? "Elevation" : "Elevation Gain"}
              value={maxElevation ? (hasElevationRange ? `Up to ${formatElevation(maxElevation, units)}` : formatElevation(maxElevation, units)) : "—"}
            />
            <QuickStat
              icon={<Flag className="h-5 w-5" />}
              label="Aid Stations"
              value={`${Math.max(...latestEdition?.race_distances.map((d) => d.aid_stations?.length || 0) || [0])}`}
            />
            <QuickStat
              icon={<Users className="h-5 w-5" />}
              label="Community"
              value={totalParticipants > 0 ? `${totalParticipants} riders` : "Be first!"}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation - Full viewport width, matching race plan page style */}
      <div className="sticky top-16 z-20 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen bg-white/80 backdrop-blur-xl border-b border-brand-navy-100">
        <div className="container mx-auto max-w-7xl px-4 lg:px-6">
          <nav className="relative flex gap-1 overflow-x-auto scrollbar-hide py-3">
            {[
              { id: "overview" as TabId, label: "Overview" },
              { id: "course" as TabId, label: "Course & Distances" },
              { id: "community" as TabId, label: "Community Gear" },
              { id: "discussions" as TabId, label: "Discussions" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
      <Dialog open={!!selectedDistance} onOpenChange={() => setSelectedDistance(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedDistance && (
            <DistanceDetailModal distance={selectedDistance} />
          )}
        </DialogContent>
      </Dialog>

      {/* Community Gear Modal (for race plan page link) */}
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

// Quick Stat Component
function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="py-4 px-4 sm:px-6 text-center">
      <div className="flex items-center justify-center gap-2 text-brand-sky-400 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-brand-navy-400">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

// Overview Tab
function OverviewTab({
  race,
  latestEdition,
}: {
  race: Race;
  latestEdition: RaceEdition | undefined;
}) {
  return (
    <div className="space-y-8">
      {/* About Section */}
      {race.description && (
        <section>
          <h2 className="text-xl font-heading font-bold text-brand-navy-900 mb-4">
            About the Race
          </h2>
          <p className="text-brand-navy-700 leading-relaxed text-lg">
            {race.description}
          </p>
        </section>
      )}

      {/* Info Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {race.weather_notes && (
          <InfoCard
            icon={<Thermometer className="h-5 w-5" />}
            title="Weather & Conditions"
            content={race.weather_notes}
          />
        )}
        {race.parking_info && (
          <InfoCard
            icon={<Car className="h-5 w-5" />}
            title="Parking"
            content={race.parking_info}
          />
        )}
        {race.course_marking && (
          <InfoCard
            icon={<Flag className="h-5 w-5" />}
            title="Course Marking"
            content={race.course_marking}
          />
        )}
        {race.crew_info && (
          <InfoCard
            icon={<Users className="h-5 w-5" />}
            title="Crew Access"
            content={race.crew_info}
          />
        )}
        {race.drop_bag_info && (
          <InfoCard
            icon={<Route className="h-5 w-5" />}
            title="Drop Bags"
            content={race.drop_bag_info}
          />
        )}
        {race.course_rules && (
          <InfoCard
            icon={<Flag className="h-5 w-5" />}
            title="Course Rules"
            content={race.course_rules}
          />
        )}
      </section>

      {/* Distance Preview */}
      {latestEdition && latestEdition.race_distances.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-bold text-brand-navy-900">
              {latestEdition.year} Distance Options
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestEdition.race_distances.slice(0, 3).map((distance) => (
              <DistancePreviewCard key={distance.id} distance={distance} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Info Card Component
function InfoCard({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-brand-sky-600 mb-3">
          {icon}
          <h3 className="font-semibold text-brand-navy-900">{title}</h3>
        </div>
        <p className="text-sm text-brand-navy-600 leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  );
}

// Distance Preview Card
function DistancePreviewCard({ distance }: { distance: RaceDistance }) {
  const { units } = useUnits();
  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-brand-navy-50 to-brand-sky-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-brand-navy-900">
                {formatDistance(distance.distance_miles, units, { includeUnit: false })}
                <span className="text-lg font-normal text-brand-navy-500 ml-1">{getDistanceUnit(units)}</span>
              </p>
              {distance.name && (
                <p className="text-sm font-medium text-brand-navy-600 mt-1">
                  {distance.name}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-brand-navy-400 group-hover:text-brand-sky-500 transition-colors" />
          </div>
        </div>
        {/* Stats */}
        <div className="p-5 space-y-2">
          {distance.elevation_gain && (
            <div className="flex items-center gap-2 text-sm text-brand-navy-600">
              <Mountain className="h-4 w-4 text-brand-navy-400" />
              {formatElevation(distance.elevation_gain, units)} gain
            </div>
          )}
          {distance.date && distance.start_time && (
            <div className="flex items-center gap-2 text-sm text-brand-navy-600">
              <Clock className="h-4 w-4 text-brand-navy-400" />
              {formatDateShort(distance.date)!} at {formatTime(distance.start_time)}
            </div>
          )}
          {distance.aid_stations && distance.aid_stations.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-brand-navy-600">
              <Flag className="h-4 w-4 text-brand-navy-400" />
              {distance.aid_stations.length} checkpoints
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Course Tab
function CourseTab({
  latestEdition,
  onDistanceSelect,
}: {
  latestEdition: RaceEdition | undefined;
  onDistanceSelect: (d: RaceDistance) => void;
}) {
  if (!latestEdition || latestEdition.race_distances.length === 0) {
    return (
      <div className="text-center py-12">
        <Route className="h-12 w-12 mx-auto text-brand-navy-300 mb-4" />
        <p className="text-brand-navy-600">No distance information available yet.</p>
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

// Full Distance Card
function DistanceCard({
  distance,
  onClick,
}: {
  distance: RaceDistance;
  onClick: () => void;
}) {
  const { units } = useUnits();
  const surface = distance.surface_composition;
  const hasSurface = surface && Object.values(surface).some((v) => v && v > 0);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Left: Main Info */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-brand-navy-900">
                  {formatDistance(distance.distance_miles, units, { includeUnit: false })}
                  <span className="text-base font-normal text-brand-navy-500 ml-1">{units === "metric" ? "kilometers" : "miles"}</span>
                </h3>
                {distance.name && (
                  <p className="text-lg font-medium text-brand-sky-600 mt-1">
                    {distance.name}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={onClick}>
                View Details
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 flex flex-wrap gap-4">
              {distance.date && (
                <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                  <Calendar className="h-4 w-4 text-brand-navy-400" />
                  {formatDateShort(distance.date)!}
                </div>
              )}
              {distance.start_time && (
                <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                  <Clock className="h-4 w-4 text-brand-navy-400" />
                  {formatTime(distance.start_time)}
                </div>
              )}
              {distance.elevation_gain && (
                <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                  <Mountain className="h-4 w-4 text-brand-navy-400" />
                  {formatElevation(distance.elevation_gain, units)} gain
                </div>
              )}
              {distance.time_limit_minutes && (
                <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                  <Timer className="h-4 w-4 text-brand-navy-400" />
                  {formatDuration(distance.time_limit_minutes)} limit
                </div>
              )}
              {distance.aid_stations && distance.aid_stations.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                  <Flag className="h-4 w-4 text-brand-navy-400" />
                  {distance.aid_stations.length} checkpoints
                </div>
              )}
            </div>

            {/* Surface Composition */}
            {hasSurface && (
              <div className="mt-4">
                <div className="flex h-3 rounded-full overflow-hidden bg-brand-navy-100">
                  {surface?.gravel && surface.gravel > 0 && (
                    <div
                      className="bg-amber-500"
                      style={{ width: `${surface.gravel}%` }}
                      title={`${surface.gravel}% Gravel`}
                    />
                  )}
                  {surface?.dirt && surface.dirt > 0 && (
                    <div
                      className="bg-orange-600"
                      style={{ width: `${surface.dirt}%` }}
                      title={`${surface.dirt}% Dirt`}
                    />
                  )}
                  {surface?.singletrack && surface.singletrack > 0 && (
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${surface.singletrack}%` }}
                      title={`${surface.singletrack}% Singletrack`}
                    />
                  )}
                  {surface?.doubletrack && surface.doubletrack > 0 && (
                    <div
                      className="bg-lime-500"
                      style={{ width: `${surface.doubletrack}%` }}
                      title={`${surface.doubletrack}% Doubletrack`}
                    />
                  )}
                  {surface?.pavement && surface.pavement > 0 && (
                    <div
                      className="bg-slate-400"
                      style={{ width: `${surface.pavement}%` }}
                      title={`${surface.pavement}% Pavement`}
                    />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {surface?.gravel && surface.gravel > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {surface.gravel}% Gravel
                    </span>
                  )}
                  {surface?.dirt && surface.dirt > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-600" />
                      {surface.dirt}% Dirt
                    </span>
                  )}
                  {surface?.singletrack && surface.singletrack > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {surface.singletrack}% Singletrack
                    </span>
                  )}
                  {surface?.doubletrack && surface.doubletrack > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-lime-500" />
                      {surface.doubletrack}% Doubletrack
                    </span>
                  )}
                  {surface?.pavement && surface.pavement > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      {surface.pavement}% Pavement
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Aid Stations Preview */}
          {distance.aid_stations && distance.aid_stations.length > 0 && (
            <div className="lg:w-80 p-6 bg-brand-navy-50 border-t lg:border-t-0 lg:border-l border-brand-navy-100">
              <h4 className="text-sm font-semibold text-brand-navy-700 mb-3">
                Checkpoints
              </h4>
              <div className="space-y-2">
                {distance.aid_stations.slice(0, 4).map((station, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-brand-navy-700 truncate pr-2">
                      {station.name}
                    </span>
                    <span className="text-brand-navy-500 font-mono text-xs">
                      {units === "metric" ? "Km" : "Mi"} {units === "metric" ? (station.mile * 1.60934).toFixed(1) : station.mile}
                    </span>
                  </div>
                ))}
                {distance.aid_stations.length > 4 && (
                  <p className="text-xs text-brand-navy-500">
                    +{distance.aid_stations.length - 4} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Distance Detail Modal
function DistanceDetailModal({ distance }: { distance: RaceDistance }) {
  const { units } = useUnits();
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">
          {distance.name || formatDistance(distance.distance_miles, units, { decimals: 0 })}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 mt-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatBox label="Distance" value={formatDistance(distance.distance_miles, units)} />
          {distance.elevation_gain && (
            <StatBox label="Elevation Gain" value={formatElevation(distance.elevation_gain, units)} />
          )}
          {distance.elevation_loss && (
            <StatBox label="Elevation Loss" value={formatElevation(distance.elevation_loss, units)} />
          )}
          {distance.time_limit_minutes && (
            <StatBox label="Time Limit" value={formatDuration(distance.time_limit_minutes)} />
          )}
          {distance.date && (
            <StatBox label="Date" value={formatDateShort(distance.date)!} />
          )}
          {distance.start_time && (
            <StatBox label="Start Time" value={formatTime(distance.start_time)} />
          )}
        </div>

        {/* Aid Stations */}
        {distance.aid_stations && distance.aid_stations.length > 0 && (
          <div>
            <h3 className="font-semibold text-brand-navy-900 mb-3">
              Aid Stations & Checkpoints
            </h3>
            <div className="space-y-2">
              {distance.aid_stations.map((station, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    station.type === "checkpoint"
                      ? "bg-brand-sky-50 border border-brand-sky-200"
                      : "bg-emerald-50 border border-emerald-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      station.type === "checkpoint"
                        ? "bg-brand-sky-200 text-brand-sky-700"
                        : "bg-emerald-200 text-emerald-700"
                    )}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-brand-navy-900">{station.name}</p>
                      <p className="text-sm text-brand-navy-500">
                        {units === "metric" ? "Km" : "Mile"} {units === "metric" ? (station.mile * 1.60934).toFixed(1) : station.mile}
                        {station.cutoff_time && ` · Cutoff: ${station.cutoff_time}`}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded",
                    station.type === "checkpoint"
                      ? "bg-brand-sky-100 text-brand-sky-700"
                      : "bg-emerald-100 text-emerald-700"
                  )}>
                    {station.type === "checkpoint" ? "Checkpoint" : "Aid Station"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg bg-brand-navy-50">
      <p className="text-xs font-medium text-brand-navy-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-brand-navy-900">{value}</p>
    </div>
  );
}

// Community Tab
function CommunityTab({
  gearStats,
  compact = false,
}: {
  gearStats: RaceGearStats | null;
  raceId?: string;
  compact?: boolean;
}) {
  if (!gearStats || gearStats.total_participants === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 mx-auto text-brand-navy-300 mb-4" />
        <h3 className="text-lg font-semibold text-brand-navy-900">
          No gear data yet
        </h3>
        <p className="mt-2 text-brand-navy-600">
          Be the first to share your setup for this race!
        </p>
      </div>
    );
  }

  const combinedTires = combineTires(gearStats.front_tires, gearStats.rear_tires);

  return (
    <div className="space-y-8">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold text-brand-navy-900">
              Community Gear Choices
            </h2>
            <p className="mt-1 text-brand-navy-600">
              See what {gearStats.total_participants} {gearStats.total_participants === 1 ? "rider is" : "riders are"} running for this race
            </p>
          </div>
        </div>
      )}

      {/* Bikes */}
      {gearStats.bikes.length > 0 && (
        <GearSection
          title="Popular Bikes"
          icon={<Bike className="h-5 w-5" />}
          items={gearStats.bikes}
          color="sky"
        />
      )}

      {/* Tires */}
      {combinedTires.length > 0 && (
        <GearSection
          title="Popular Tires"
          icon={<Circle className="h-5 w-5" />}
          items={combinedTires}
          color="amber"
        />
      )}
    </div>
  );
}

function GearSection({
  title,
  icon,
  items,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  items: GearAggregation[];
  color: "sky" | "amber";
}) {
  const topItems = items.slice(0, 5);
  const maxCount = Math.max(...topItems.map((item) => item.count), 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className={cn(
          "p-2 rounded-lg",
          color === "sky" ? "bg-brand-sky-100 text-brand-sky-600" : "bg-amber-100 text-amber-600"
        )}>
          {icon}
        </span>
        <h3 className="font-semibold text-brand-navy-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {topItems.map((item, index) => (
          <div key={`${item.brand}-${item.model}-${item.width || ''}-${index}`} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-brand-navy-900">
                {item.brand} {item.model}
                {item.width && (
                  <span className="ml-1.5 text-sm font-normal text-brand-navy-500">
                    ({item.width})
                  </span>
                )}
              </span>
              <span className="text-sm text-brand-navy-500">
                {item.count} {item.count === 1 ? "rider" : "riders"} · {item.percentage}%
              </span>
            </div>
            <div className="h-2 bg-brand-navy-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  color === "sky" ? "bg-brand-sky-500" : "bg-amber-500"
                )}
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  opacity: 1 - index * 0.1,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to combine front and rear tire data
function combineTires(
  frontTires: GearAggregation[],
  rearTires: GearAggregation[]
): GearAggregation[] {
  const combined = new Map<string, GearAggregation>();

  [...frontTires, ...rearTires].forEach((tire) => {
    // Include width in key so different sizes are shown separately
    const key = `${tire.brand}|${tire.model}|${tire.width || ''}`;
    const existing = combined.get(key);
    if (existing) {
      existing.count = Math.max(existing.count, tire.count);
      existing.percentage = Math.max(existing.percentage, tire.percentage);
    } else {
      combined.set(key, { ...tire });
    }
  });

  return Array.from(combined.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
