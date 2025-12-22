"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Route,
  ArrowUpDown,
  Grid3X3,
  List,
} from "lucide-react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { RaceCard, RaceCardSkeleton } from "@/components/race/RaceCard";

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
  hero_image_url: string | null;
  race_type: "bike";
  race_subtype: string;
  race_editions: RaceEdition[];
  participant_count?: number;
}

type SortOption = "alphabetical" | "date";
type DisciplineFilter = "all" | "gravel" | "mtb" | "road" | "cx";
type ViewMode = "grid" | "list";

export default function RacesPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
        hero_image_url,
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

    const counts: Record<string, number> = {};
    (data || []).forEach((plan) => {
      if (plan.race_id) {
        counts[plan.race_id] = (counts[plan.race_id] || 0) + 1;
      }
    });
    setParticipantCounts(counts);
  }

  function getEarliestUpcomingDate(race: Race): Date | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Look at ALL editions to find the next upcoming date
    const allDates: Date[] = [];
    for (const edition of race.race_editions) {
      for (const distance of edition.race_distances) {
        if (distance.date) {
          allDates.push(parseLocalDate(distance.date));
        }
      }
    }

    // Filter to only upcoming dates, or if none, use all dates
    const upcomingDates = allDates.filter(d => d >= today);
    const datesToSort = upcomingDates.length > 0 ? upcomingDates : allDates;

    if (datesToSort.length === 0) return null;
    return datesToSort.sort((a, b) => a.getTime() - b.getTime())[0] || null;
  }

  const filteredAndSortedRaces = useMemo(() => {
    let result = races;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (race) =>
          race.name.toLowerCase().includes(query) ||
          (race.location?.toLowerCase() || "").includes(query)
      );
    }

    if (disciplineFilter !== "all") {
      result = result.filter((race) => race.race_subtype === disciplineFilter);
    }

    if (sortBy === "alphabetical") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result = [...result].sort((a, b) => {
        const dateA = getEarliestUpcomingDate(a);
        const dateB = getEarliestUpcomingDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      });
    }

    return result;
  }, [races, searchQuery, disciplineFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900 sm:text-3xl">
          Discover Races
        </h1>
        <p className="mt-2 text-brand-navy-600">
          Find your next adventure and see what other athletes are planning
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
          <Input
            placeholder="Search races by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
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

            {/* Discipline Filter */}
            <div className="flex items-center gap-1 bg-brand-navy-100 rounded-lg p-1">
              {[
                { value: "all", label: "All" },
                { value: "gravel", label: "Gravel" },
                { value: "mtb", label: "MTB" },
                { value: "road", label: "Road" },
                { value: "cx", label: "CX" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDisciplineFilter(value as DisciplineFilter)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    disciplineFilter === value
                      ? "bg-white text-brand-navy-900 shadow-sm"
                      : "text-brand-navy-600 hover:text-brand-navy-900"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-brand-navy-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-white text-brand-navy-900 shadow-sm"
                  : "text-brand-navy-500 hover:text-brand-navy-700"
              )}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-white text-brand-navy-900 shadow-sm"
                  : "text-brand-navy-500 hover:text-brand-navy-700"
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={cn(
          "gap-6",
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid grid-cols-1"
        )}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <RaceCardSkeleton key={i} variant={viewMode === "list" ? "compact" : "default"} />
          ))}
        </div>
      )}

      {/* Races Grid/List */}
      {!loading && (
        <div className={cn(
          "gap-6",
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid grid-cols-1 max-w-3xl"
        )}>
          {filteredAndSortedRaces.map((race) => {
            const latestEdition = race.race_editions[0];
            const participantCount = participantCounts[race.id] || 0;
            // Only show dates from the edition with upcoming dates, or fall back to latest
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const editionWithUpcoming = race.race_editions.find(ed =>
              ed.race_distances.some(d => d.date && parseLocalDate(d.date) >= today)
            ) || latestEdition;
            const allDates = editionWithUpcoming?.race_distances?.map(d => d.date) || [];
            const dateRange = formatDateRange(allDates);
            const distances = (editionWithUpcoming?.race_distances || []).map(d => ({
              miles: d.distance_miles,
              elevationGain: d.elevation_gain,
            }));

            return (
              <RaceCard
                key={race.id}
                name={race.name}
                slug={race.slug}
                location={race.location}
                heroImageUrl={race.hero_image_url}
                dateRange={dateRange}
                distances={distances}
                participantCount={participantCount}
                raceSubtype={race.race_subtype}
                variant={viewMode === "list" ? "compact" : "default"}
              />
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedRaces.length === 0 && (
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-brand-navy-100 inline-flex mb-4">
            <Route className="h-8 w-8 text-brand-navy-400" />
          </div>
          <h2 className="text-lg font-semibold text-brand-navy-900">
            {searchQuery || disciplineFilter !== "all" ? "No races found" : "No races available"}
          </h2>
          <p className="mt-2 text-brand-navy-600 max-w-sm mx-auto">
            {searchQuery || disciplineFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Check back soon for upcoming races!"}
          </p>
        </div>
      )}

      {/* Results count */}
      {!loading && filteredAndSortedRaces.length > 0 && (
        <p className="text-sm text-brand-navy-500 text-center">
          Showing {filteredAndSortedRaces.length} {filteredAndSortedRaces.length === 1 ? "race" : "races"}
        </p>
      )}
    </div>
  );
}
