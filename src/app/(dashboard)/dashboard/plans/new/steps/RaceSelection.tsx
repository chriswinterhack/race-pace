"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Calendar, Mountain, Check, Route, ChevronLeft } from "lucide-react";
import { Input, Skeleton, Button } from "@/components/ui";
import { cn, formatDateWithYear } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { usePlanBuilder } from "../context/PlanBuilderContext";
import type { RaceDistance } from "@/types";

interface RaceDistanceWithEdition extends RaceDistance {
  race_edition: {
    id: string;
    year: number;
    race: {
      id: string;
      name: string;
      location: string | null;
      description: string | null;
    };
  };
}

interface Race {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  year: number;
  distances: RaceDistanceWithEdition[];
}

interface RaceSelectionProps {
  preselectedDistanceId: string | null;
}

export function RaceSelection({ preselectedDistanceId }: RaceSelectionProps) {
  const { state, dispatch } = usePlanBuilder();
  const [distances, setDistances] = useState<RaceDistanceWithEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchDistances();
  }, []);

  useEffect(() => {
    // Auto-select preselected distance
    if (preselectedDistanceId && distances.length > 0 && !state.distance) {
      const distance = distances.find((d) => d.id === preselectedDistanceId);
      if (distance) {
        // First select the race
        const raceName = distance.race_edition.race.name;
        const raceData = groupedRaces.find(r => r.name === raceName);
        if (raceData) {
          setSelectedRace(raceData);
        }
        // Then select the distance
        selectDistance(distance);
      }
    }
  }, [preselectedDistanceId, distances]);

  async function fetchDistances() {
    setLoading(true);
    const { data, error } = await supabase
      .from("race_distances")
      .select(`
        *,
        race_edition:race_editions (
          id,
          year,
          race:races (
            id,
            name,
            location,
            description
          )
        )
      `)
      .eq("is_active", true)
      .order("distance_miles", { ascending: false });

    if (error) {
      console.error("Error fetching distances:", error);
    } else {
      setDistances(data || []);
    }
    setLoading(false);
  }

  const selectDistance = (distance: RaceDistanceWithEdition) => {
    const raceDistance: RaceDistance = {
      id: distance.id,
      race_edition_id: distance.race_edition.id,
      name: distance.name,
      distance_miles: distance.distance_miles,
      distance_km: distance.distance_km,
      date: distance.date,
      start_time: distance.start_time,
      wave_info: distance.wave_info,
      gpx_file_url: distance.gpx_file_url,
      elevation_gain: distance.elevation_gain,
      elevation_loss: distance.elevation_loss,
      elevation_high: distance.elevation_high,
      elevation_low: distance.elevation_low,
      surface_composition: distance.surface_composition,
      climbing_pct: null,
      flat_pct: null,
      descent_pct: null,
      avg_climb_grade: null,
      avg_descent_grade: null,
      total_elevation_loss: null,
      aid_stations: distance.aid_stations,
      time_limit_minutes: distance.time_limit_minutes,
      participant_limit: distance.participant_limit,
      registration_url: distance.registration_url,
      registration_fee_cents: distance.registration_fee_cents,
      is_active: distance.is_active,
      sort_order: distance.sort_order,
      created_at: distance.created_at,
      updated_at: distance.updated_at,
    };

    dispatch({
      type: "SET_DISTANCE",
      distance: raceDistance,
      raceName: distance.race_edition.race.name,
      raceLocation: distance.race_edition.race.location || "",
    });

    // Set start time if available
    if (distance.start_time) {
      dispatch({ type: "SET_START_TIME", startTime: distance.start_time.slice(0, 5) });
    }
  };

  // Group distances by race
  const groupedRaces: Race[] = Object.values(
    distances.reduce((acc, distance) => {
      const raceId = distance.race_edition.race.id;
      if (!acc[raceId]) {
        acc[raceId] = {
          id: raceId,
          name: distance.race_edition.race.name,
          location: distance.race_edition.race.location,
          description: distance.race_edition.race.description,
          year: distance.race_edition.year,
          distances: [],
        };
      }
      acc[raceId].distances.push(distance);
      return acc;
    }, {} as Record<string, Race>)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredRaces = groupedRaces.filter(
    (race) =>
      race.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (race.location?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const handleBackToRaces = () => {
    setSelectedRace(null);
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // If a race is selected, show distances for that race
  if (selectedRace) {
    return (
      <div className="space-y-6">
        {/* Back button and header */}
        <div>
          <button
            onClick={handleBackToRaces}
            className="flex items-center gap-1 text-sm text-brand-navy-600 hover:text-brand-navy-900 mb-3"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to races
          </button>
          <h2 className="text-lg font-semibold text-brand-navy-900">
            Select Distance
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Choose your distance for {selectedRace.name}
          </p>
        </div>

        {/* Race info card */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-brand-sky-50 to-brand-navy-50 border border-brand-sky-200">
          <h3 className="text-xl font-bold text-brand-navy-900">{selectedRace.name}</h3>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-brand-navy-600">
            {selectedRace.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {selectedRace.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {selectedRace.year}
            </span>
          </div>
          {selectedRace.description && (
            <p className="mt-3 text-sm text-brand-navy-600">{selectedRace.description}</p>
          )}
        </div>

        {/* Selected distance summary */}
        {state.distance && state.raceName === selectedRace.name && (
          <div className="p-4 rounded-lg bg-brand-sky-50 border border-brand-sky-200">
            <div className="flex items-center gap-2 text-brand-sky-700">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                Selected: {state.distance.name || `${state.distance.distance_miles} mi`}
              </span>
            </div>
          </div>
        )}

        {/* Distance options */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {selectedRace.distances.map((distance) => {
            const isSelected = state.distanceId === distance.id;
            const displayName = distance.name
              ? `${distance.name}`
              : `${distance.distance_miles} mi`;

            return (
              <button
                key={distance.id}
                onClick={() => selectDistance(distance)}
                className={cn(
                  "text-left p-5 rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-brand-sky-500 bg-brand-sky-50 ring-2 ring-brand-sky-200"
                    : "border-brand-navy-200 hover:border-brand-sky-300 hover:bg-brand-navy-50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-brand-navy-900 text-lg">
                      {displayName}
                    </h4>
                    <p className="text-2xl font-bold text-brand-navy-900 mt-1">
                      {distance.distance_miles} mi
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-brand-navy-600">
                      {distance.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDateWithYear(distance.date)}
                        </span>
                      )}
                      {distance.elevation_gain && (
                        <span className="flex items-center gap-1">
                          <Mountain className="h-4 w-4" />
                          {distance.elevation_gain.toLocaleString()} ft gain
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 ml-3">
                      <div className="h-6 w-6 rounded-full bg-brand-sky-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Show race list (step 1)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">
          Select Your Race
        </h2>
        <p className="mt-1 text-sm text-brand-navy-600">
          Choose a race to start building your plan
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

      {/* Already selected indicator */}
      {state.distance && (
        <div className="p-4 rounded-lg bg-brand-sky-50 border border-brand-sky-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand-sky-700">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                {state.raceName} - {state.distance.name || `${state.distance.distance_miles} mi`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const race = groupedRaces.find(r => r.name === state.raceName);
                if (race) setSelectedRace(race);
              }}
              className="text-brand-sky-700 hover:text-brand-sky-900"
            >
              Change
            </Button>
          </div>
        </div>
      )}

      {/* Race List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredRaces.map((race) => {
          const distanceRange = race.distances.length > 1
            ? `${Math.min(...race.distances.map(d => d.distance_miles))}-${Math.max(...race.distances.map(d => d.distance_miles))} mi`
            : `${race.distances[0]?.distance_miles} mi`;

          return (
            <button
              key={race.id}
              onClick={() => setSelectedRace(race)}
              className="text-left p-5 rounded-lg border-2 border-brand-navy-200 hover:border-brand-sky-400 hover:bg-brand-navy-50 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-brand-navy-900 text-lg group-hover:text-brand-sky-700 transition-colors">
                    {race.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-brand-navy-600">
                    {race.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {race.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {race.year}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand-navy-100 text-sm font-medium text-brand-navy-700">
                      <Route className="h-3.5 w-3.5" />
                      {distanceRange}
                    </span>
                    <span className="text-sm text-brand-navy-500">
                      {race.distances.length} distance{race.distances.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <ChevronLeft className="h-5 w-5 text-brand-navy-400 rotate-180 group-hover:text-brand-sky-500 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {filteredRaces.length === 0 && (
        <div className="text-center py-8">
          <Route className="h-8 w-8 text-brand-navy-300 mx-auto mb-2" />
          <p className="text-brand-navy-600">No races found matching your search.</p>
        </div>
      )}
    </div>
  );
}
