"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  Route,
  Users,
  Bike,
  Footprints,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  Input,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Parse date string as local time to avoid timezone issues
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

function formatDateRange(dates: (string | null)[]): string | null {
  const validDates = dates
    .filter((d): d is string => d !== null)
    .map((d) => parseLocalDate(d))
    .sort((a, b) => a.getTime() - b.getTime());

  if (validDates.length === 0) return null;

  const firstDate = validDates[0]!;
  const lastDate = validDates[validDates.length - 1]!;

  if (validDates.length === 1 || firstDate.getTime() === lastDate.getTime()) {
    return firstDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const sameYear = firstDate.getFullYear() === lastDate.getFullYear();
  const sameMonth = sameYear && firstDate.getMonth() === lastDate.getMonth();

  if (sameMonth) {
    const month = firstDate.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${firstDate.getDate()}-${lastDate.getDate()}, ${firstDate.getFullYear()}`;
  } else if (sameYear) {
    const firstFormatted = firstDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const lastFormatted = lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${firstFormatted} - ${lastFormatted}, ${firstDate.getFullYear()}`;
  } else {
    const firstFormatted = firstDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const lastFormatted = lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${firstFormatted} - ${lastFormatted}`;
  }
}

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
  race_distances: RaceDistance[];
}

interface Race {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  race_type: "bike" | "run";
  race_subtype: string;
  race_editions: RaceEdition[];
  participant_count?: number;
}

type SortOption = "alphabetical" | "date";
type TypeFilter = "all" | "bike" | "run";
type DisciplineFilter = "all" | "gravel" | "mtb" | "road";

export default function RacesPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters and sorting
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>("all");

  const supabase = createClient();

  useEffect(() => {
    fetchRaces();
    fetchParticipantCounts();
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
        race_type,
        race_subtype,
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
      })) as Race[];
      setRaces(sortedRaces);
    }
    setLoading(false);
  }

  async function fetchParticipantCounts() {
    const { data, error } = await supabase
      .from("race_plans")
      .select("race_id");

    if (error) {
      console.error("Error fetching participant counts:", error);
      return;
    }

    // Count participants per race
    const counts: Record<string, number> = {};
    (data || []).forEach((plan) => {
      if (plan.race_id) {
        counts[plan.race_id] = (counts[plan.race_id] || 0) + 1;
      }
    });
    setParticipantCounts(counts);
  }

  // Get earliest date for a race (for sorting)
  function getEarliestDate(race: Race): Date | null {
    const latestEdition = race.race_editions[0];
    if (!latestEdition) return null;

    const dates = latestEdition.race_distances
      .map(d => d.date)
      .filter((d): d is string => d !== null)
      .map(d => parseLocalDate(d));

    if (dates.length === 0) return null;
    return dates.sort((a, b) => a.getTime() - b.getTime())[0] || null;
  }

  // Filter and sort races
  const filteredAndSortedRaces = useMemo(() => {
    let result = races;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (race) =>
          race.name.toLowerCase().includes(query) ||
          (race.location?.toLowerCase() || "").includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((race) => race.race_type === typeFilter);
    }

    // Discipline filter (only applies to bike races)
    if (typeFilter === "bike" && disciplineFilter !== "all") {
      result = result.filter((race) => race.race_subtype === disciplineFilter);
    }

    // Sort
    if (sortBy === "alphabetical") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Sort by date (soonest first, races without dates at end)
      result = [...result].sort((a, b) => {
        const dateA = getEarliestDate(a);
        const dateB = getEarliestDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      });
    }

    return result;
  }, [races, searchQuery, typeFilter, disciplineFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
          Browse Races
        </h1>
        <p className="mt-1 text-brand-navy-600">
          Discover races and see what other athletes are planning
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
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

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-brand-navy-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border border-brand-navy-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sky-400"
            >
              <option value="date">Sort by Date</option>
              <option value="alphabetical">Sort A-Z</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-brand-navy-100 rounded-lg p-1">
            <button
              onClick={() => {
                setTypeFilter("all");
                setDisciplineFilter("all");
              }}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                typeFilter === "all"
                  ? "bg-white text-brand-navy-900 shadow-sm"
                  : "text-brand-navy-600 hover:text-brand-navy-900"
              )}
            >
              All
            </button>
            <button
              onClick={() => {
                setTypeFilter("bike");
                setDisciplineFilter("all");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                typeFilter === "bike"
                  ? "bg-white text-brand-navy-900 shadow-sm"
                  : "text-brand-navy-600 hover:text-brand-navy-900"
              )}
            >
              <Bike className="h-4 w-4" />
              Cycling
            </button>
            <button
              onClick={() => {
                setTypeFilter("run");
                setDisciplineFilter("all");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                typeFilter === "run"
                  ? "bg-white text-brand-navy-900 shadow-sm"
                  : "text-brand-navy-600 hover:text-brand-navy-900"
              )}
            >
              <Footprints className="h-4 w-4" />
              Running
            </button>
          </div>

          {/* Discipline Filter (only shown for Cycling) */}
          {typeFilter === "bike" && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-brand-navy-500" />
              <select
                value={disciplineFilter}
                onChange={(e) => setDisciplineFilter(e.target.value as DisciplineFilter)}
                className="text-sm border border-brand-navy-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sky-400"
              >
                <option value="all">All Disciplines</option>
                <option value="gravel">Gravel</option>
                <option value="mtb">MTB</option>
                <option value="road">Road</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
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
          {filteredAndSortedRaces.map((race) => {
            const latestEdition = race.race_editions[0];
            const participantCount = participantCounts[race.id] || 0;

            // Collect all dates from distances
            const allDates = latestEdition?.race_distances?.map(d => d.date) || [];
            const dateRange = formatDateRange(allDates);

            return (
              <Link key={race.id} href={`/dashboard/races/${race.slug}`}>
                <Card className="hover:shadow-elevated hover:border-brand-sky-300 transition-all cursor-pointer group">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Race Type Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            race.race_type === "bike"
                              ? "bg-brand-sky-100 text-brand-sky-700"
                              : "bg-emerald-100 text-emerald-700"
                          )}>
                            {race.race_type === "bike" ? (
                              <Bike className="h-3 w-3" />
                            ) : (
                              <Footprints className="h-3 w-3" />
                            )}
                            {race.race_subtype ? (
                              race.race_subtype.charAt(0).toUpperCase() + race.race_subtype.slice(1)
                            ) : (
                              race.race_type === "bike" ? "Cycling" : "Running"
                            )}
                          </span>
                        </div>

                        {/* Race Name */}
                        <h3 className="text-lg font-semibold text-brand-navy-900 group-hover:text-brand-sky-600 transition-colors">
                          {race.name}
                        </h3>

                        {/* Meta Info */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-navy-600">
                          {race.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {race.location}
                            </span>
                          )}
                          {dateRange && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {dateRange}
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
                          {participantCount > 0 && (
                            <span className="flex items-center gap-1 text-brand-sky-600">
                              <Users className="h-3.5 w-3.5" />
                              {participantCount} {participantCount === 1 ? "athlete" : "athletes"}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-brand-navy-400 group-hover:text-brand-sky-500 transition-colors flex-shrink-0 ml-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedRaces.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 rounded-full bg-brand-navy-100 inline-flex mb-4">
            <Route className="h-8 w-8 text-brand-navy-400" />
          </div>
          <h2 className="text-lg font-medium text-brand-navy-900">
            {searchQuery || typeFilter !== "all" ? "No races found" : "No races available"}
          </h2>
          <p className="mt-1 text-brand-navy-600 max-w-sm mx-auto">
            {searchQuery || typeFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Check back soon for upcoming races!"}
          </p>
        </div>
      )}
    </div>
  );
}
