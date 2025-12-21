"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Calendar,
  Mountain,
  ChevronRight,
  Route,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Input,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface RaceDistance {
  id: string;
  name: string | null;
  distance_miles: number;
  date: string | null;
  elevation_gain: number | null;
}

interface RaceEdition {
  id: string;
  year: number;
  date: string | null;
  race_distances: RaceDistance[];
}

interface Race {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  race_editions: RaceEdition[];
}

export default function RacesPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRace, setExpandedRace] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchRaces();
  }, []);

  async function fetchRaces() {
    setLoading(true);
    const { data, error } = await supabase
      .from("races")
      .select(`
        id,
        name,
        slug,
        location,
        description,
        race_editions (
          id,
          year,
          date,
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

    if (error) {
      console.error("Error fetching races:", error);
    } else {
      // Sort editions by year descending, distances by distance descending
      const sortedRaces = (data || []).map((race) => ({
        ...race,
        race_editions: (race.race_editions || [])
          .sort((a: RaceEdition, b: RaceEdition) => b.year - a.year)
          .map((edition: RaceEdition) => ({
            ...edition,
            race_distances: (edition.race_distances || []).sort(
              (a: RaceDistance, b: RaceDistance) => b.distance_miles - a.distance_miles
            ),
          })),
      }));
      setRaces(sortedRaces);
    }
    setLoading(false);
  }

  const filteredRaces = races.filter(
    (race) =>
      race.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (race.location?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
          Races
        </h1>
        <p className="mt-1 text-brand-navy-600">
          Browse races and start planning your race day
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
        <Input
          placeholder="Search races..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Races List */}
      {!loading && (
        <div className="grid gap-4">
          {filteredRaces.map((race) => {
            const latestEdition = race.race_editions[0];
            const isExpanded = expandedRace === race.id;

            return (
              <Card
                key={race.id}
                className={cn(
                  "overflow-hidden transition-all",
                  isExpanded && "ring-2 ring-brand-sky-400"
                )}
              >
                <CardContent className="p-0">
                  {/* Race Header */}
                  <button
                    onClick={() => setExpandedRace(isExpanded ? null : race.id)}
                    className="w-full p-4 sm:p-6 flex items-start justify-between text-left hover:bg-brand-navy-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-brand-navy-900">
                        {race.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-navy-600">
                        {race.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {race.location}
                          </span>
                        )}
                        {latestEdition && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {latestEdition.year}
                          </span>
                        )}
                        {latestEdition?.race_distances && latestEdition.race_distances.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Route className="h-3.5 w-3.5" />
                            {latestEdition.race_distances
                              .map((d) => `${d.distance_miles}mi`)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-5 w-5 text-brand-navy-400 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>

                  {/* Expanded Content - Distance Options */}
                  {isExpanded && latestEdition && (
                    <div className="border-t border-brand-navy-100 bg-brand-navy-50/30 p-4 sm:p-6">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-brand-navy-700">
                          {latestEdition.year} Distances
                        </h4>
                        {race.description && (
                          <p className="mt-1 text-sm text-brand-navy-600">
                            {race.description}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {latestEdition.race_distances.map((distance) => (
                          <DistanceCard
                            key={distance.id}
                            distance={distance}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && filteredRaces.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 rounded-full bg-brand-navy-100 inline-flex mb-4">
            <Route className="h-8 w-8 text-brand-navy-400" />
          </div>
          <h2 className="text-lg font-medium text-brand-navy-900">
            {searchQuery ? "No races found" : "No races available"}
          </h2>
          <p className="mt-1 text-brand-navy-600 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search terms."
              : "Check back soon for upcoming races!"}
          </p>
        </div>
      )}
    </div>
  );
}

interface DistanceCardProps {
  distance: RaceDistance;
}

function DistanceCard({ distance }: DistanceCardProps) {
  const displayName = distance.name
    ? `${distance.name} (${distance.distance_miles} mi)`
    : `${distance.distance_miles} mi`;

  return (
    <div className="bg-white rounded-lg border border-brand-navy-200 p-4 hover:border-brand-sky-400 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between">
        <div>
          <h5 className="font-semibold text-brand-navy-900">{displayName}</h5>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-brand-navy-600">
            {distance.date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(distance.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {distance.elevation_gain && (
              <span className="flex items-center gap-1">
                <Mountain className="h-3 w-3" />
                {distance.elevation_gain.toLocaleString()} ft
              </span>
            )}
          </div>
        </div>
      </div>
      <Link
        href={`/dashboard/plans/new?distanceId=${distance.id}`}
        className="mt-3 block"
      >
        <Button size="sm" className="w-full">
          Create Plan
        </Button>
      </Link>
    </div>
  );
}
