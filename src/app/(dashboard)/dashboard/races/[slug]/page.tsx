"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  DollarSign,
  Flag,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { AddToMyRacesModal } from "@/components/race/AddToMyRacesModal";

// Parse date string as local time to avoid timezone issues
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    month: "short",
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
}

interface SurfaceComposition {
  gravel_pct?: number;
  pavement_pct?: number;
  singletrack_pct?: number;
  dirt_pct?: number;
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
  race_type: "bike" | "run";
  race_subtype: string;
  parking_info: string | null;
  weather_notes: string | null;
  race_editions: RaceEdition[];
}

interface Participant {
  id: string;
  race_distance_id: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
  gear_setup: {
    bike_brand: string | null;
    bike_model: string | null;
    tire_brand: string | null;
    tire_model: string | null;
    tire_width: number | null;
  } | null;
}

export default function RaceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [race, setRace] = useState<Race | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedDistances, setExpandedDistances] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    if (slug) {
      fetchRace();
      fetchParticipants();
    }
  }, [slug]);

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
        race_type,
        race_subtype,
        parking_info,
        weather_notes,
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
      // Sort editions by year descending, distances by distance descending
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

  async function fetchParticipants() {
    // First get race ID from slug
    const { data: raceData } = await supabase
      .from("races")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!raceData) return;

    // Fetch participants with their gear
    const { data, error } = await supabase
      .from("race_plans")
      .select(`
        id,
        race_distance_id,
        user_id,
        users (
          id,
          full_name,
          email
        )
      `)
      .eq("race_id", raceData.id);

    if (error) {
      console.error("Error fetching participants:", error);
      return;
    }

    // Fetch gear setups for these users
    const userIds = [...new Set((data || []).map(p => p.user_id).filter(Boolean))];
    let gearMap: Record<string, Participant["gear_setup"]> = {};

    if (userIds.length > 0) {
      const { data: gearData } = await supabase
        .from("gear_setups")
        .select("user_id, bike_brand, bike_model, tire_brand, tire_model, tire_width")
        .eq("race_id", raceData.id)
        .eq("is_public", true)
        .in("user_id", userIds);

      if (gearData) {
        gearData.forEach((g) => {
          gearMap[g.user_id] = {
            bike_brand: g.bike_brand,
            bike_model: g.bike_model,
            tire_brand: g.tire_brand,
            tire_model: g.tire_model,
            tire_width: g.tire_width,
          };
        });
      }
    }

    const participantsWithGear = (data || []).map((p) => {
      const userData = p.users as unknown as { id: string; full_name: string | null; email: string } | null;
      return {
        id: p.id,
        race_distance_id: p.race_distance_id,
        user: userData || { id: p.user_id, full_name: null, email: "" },
        gear_setup: p.user_id ? gearMap[p.user_id] || null : null,
      };
    });

    setParticipants(participantsWithGear);
  }

  function toggleDistanceExpanded(distanceId: string) {
    setExpandedDistances((prev) => {
      const next = new Set(prev);
      if (next.has(distanceId)) {
        next.delete(distanceId);
      } else {
        next.add(distanceId);
      }
      return next;
    });
  }

  function getParticipantsForDistance(distanceId: string): Participant[] {
    return participants.filter((p) => p.race_distance_id === distanceId);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!race) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-brand-navy-900">Race not found</h1>
        <p className="mt-2 text-brand-navy-600">The race you're looking for doesn't exist.</p>
        <Link href="/dashboard/races">
          <Button className="mt-4">Back to Races</Button>
        </Link>
      </div>
    );
  }

  const latestEdition = race.race_editions[0];
  const allDates = latestEdition?.race_distances?.map((d) => d.date).filter(Boolean) || [];
  const firstDate = allDates.length > 0 ? allDates.sort()[0] : null;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        href="/dashboard/races"
        className="inline-flex items-center gap-2 text-sm text-brand-navy-600 hover:text-brand-navy-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Races
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {/* Race Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
              race.race_type === "bike"
                ? "bg-brand-sky-100 text-brand-sky-700"
                : "bg-emerald-100 text-emerald-700"
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
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-brand-navy-900">
            {race.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-brand-navy-600">
            {race.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {race.location}
              </span>
            )}
            {firstDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(firstDate)}
              </span>
            )}
          </div>
        </div>

        <Button onClick={() => setShowAddModal(true)} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Add to My Races
        </Button>
      </div>

      {/* Race Info Section */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-brand-navy-900">About the Race</h2>

          {race.description && (
            <p className="text-brand-navy-700 leading-relaxed">{race.description}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Registration Info */}
            {latestEdition?.registration_opens && (
              <div className="p-4 rounded-lg bg-brand-navy-50">
                <p className="text-sm font-medium text-brand-navy-500">Registration Opens</p>
                <p className="mt-1 font-semibold text-brand-navy-900">
                  {formatShortDate(latestEdition.registration_opens)}
                </p>
              </div>
            )}
            {latestEdition?.registration_closes && (
              <div className="p-4 rounded-lg bg-brand-navy-50">
                <p className="text-sm font-medium text-brand-navy-500">Registration Closes</p>
                <p className="mt-1 font-semibold text-brand-navy-900">
                  {formatShortDate(latestEdition.registration_closes)}
                </p>
              </div>
            )}

            {/* Website */}
            {race.website_url && (
              <div className="p-4 rounded-lg bg-brand-navy-50">
                <p className="text-sm font-medium text-brand-navy-500">Official Website</p>
                <a
                  href={race.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-semibold text-brand-sky-600 hover:text-brand-sky-700"
                >
                  Visit Site
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {/* Weather Notes */}
            {race.weather_notes && (
              <div className="p-4 rounded-lg bg-brand-navy-50 sm:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium text-brand-navy-500">Weather & Conditions</p>
                <p className="mt-1 text-brand-navy-700">{race.weather_notes}</p>
              </div>
            )}

            {/* Parking */}
            {race.parking_info && (
              <div className="p-4 rounded-lg bg-brand-navy-50 sm:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium text-brand-navy-500">Parking Information</p>
                <p className="mt-1 text-brand-navy-700">{race.parking_info}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distances Section */}
      {latestEdition && latestEdition.race_distances.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-navy-900">
            {latestEdition.year} Distances
          </h2>

          <div className="grid gap-4">
            {latestEdition.race_distances.map((distance) => {
              const distanceParticipants = getParticipantsForDistance(distance.id);
              const isExpanded = expandedDistances.has(distance.id);
              const displayName = distance.name
                ? `${distance.name} (${distance.distance_miles} mi)`
                : `${distance.distance_miles} mi`;

              return (
                <Card key={distance.id}>
                  <CardContent className="p-0">
                    {/* Distance Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-brand-navy-900">
                            {displayName}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-brand-navy-600">
                            {distance.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatShortDate(distance.date)}
                              </span>
                            )}
                            {distance.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(distance.start_time)}
                              </span>
                            )}
                            {distance.elevation_gain && (
                              <span className="flex items-center gap-1">
                                <Mountain className="h-4 w-4" />
                                {distance.elevation_gain.toLocaleString()} ft gain
                              </span>
                            )}
                            {distance.aid_stations && distance.aid_stations.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Flag className="h-4 w-4" />
                                {distance.aid_stations.length} aid stations
                              </span>
                            )}
                            {distance.registration_fee_cents && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                ${(distance.registration_fee_cents / 100).toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {distanceParticipants.length > 0 && (
                            <span className="flex items-center gap-1 text-sm text-brand-sky-600">
                              <Users className="h-4 w-4" />
                              {distanceParticipants.length}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Surface Composition */}
                      {distance.surface_composition && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-brand-navy-500 mb-2">Surface</p>
                          <div className="flex gap-2 flex-wrap">
                            {distance.surface_composition.gravel_pct && distance.surface_composition.gravel_pct > 0 && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-md">
                                {distance.surface_composition.gravel_pct}% Gravel
                              </span>
                            )}
                            {distance.surface_composition.pavement_pct && distance.surface_composition.pavement_pct > 0 && (
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md">
                                {distance.surface_composition.pavement_pct}% Paved
                              </span>
                            )}
                            {distance.surface_composition.dirt_pct && distance.surface_composition.dirt_pct > 0 && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md">
                                {distance.surface_composition.dirt_pct}% Dirt
                              </span>
                            )}
                            {distance.surface_composition.singletrack_pct && distance.surface_composition.singletrack_pct > 0 && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                                {distance.surface_composition.singletrack_pct}% Singletrack
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Participants Toggle */}
                    {distanceParticipants.length > 0 && (
                      <>
                        <button
                          onClick={() => toggleDistanceExpanded(distance.id)}
                          className="w-full px-5 py-3 flex items-center justify-between border-t border-brand-navy-100 hover:bg-brand-navy-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-brand-navy-700">
                            View {distanceParticipants.length} {distanceParticipants.length === 1 ? "Participant" : "Participants"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-brand-navy-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-brand-navy-500" />
                          )}
                        </button>

                        {/* Participants List */}
                        {isExpanded && (
                          <div className="border-t border-brand-navy-100 bg-brand-navy-50/50 p-5">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {distanceParticipants.map((participant) => (
                                <ParticipantCard key={participant.id} participant={participant} />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

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

function ParticipantCard({ participant }: { participant: Participant }) {
  const displayName = participant.user?.full_name || participant.user?.email || "Anonymous";
  const gear = participant.gear_setup;

  return (
    <div className="p-3 bg-white rounded-lg border border-brand-navy-200">
      <p className="font-medium text-brand-navy-900 truncate">{displayName}</p>
      {gear ? (
        <div className="mt-1 text-xs text-brand-navy-600 space-y-0.5">
          {(gear.bike_brand || gear.bike_model) && (
            <p className="flex items-center gap-1">
              <Bike className="h-3 w-3" />
              {[gear.bike_brand, gear.bike_model].filter(Boolean).join(" ")}
            </p>
          )}
          {(gear.tire_brand || gear.tire_model) && (
            <p>
              Tires: {[gear.tire_brand, gear.tire_model, gear.tire_width ? `${gear.tire_width}mm` : null].filter(Boolean).join(" ")}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-1 text-xs text-brand-navy-400 italic">No public gear info</p>
      )}
    </div>
  );
}
