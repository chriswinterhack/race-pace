"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Calendar,
  Mountain,
  Route,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface RaceDistance {
  id: string;
  name: string | null;
  distance_miles: number;
  date: string | null;
  elevation_gain: number | null;
  race_edition_id: string;
}

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

interface AddRaceModalProps {
  open: boolean;
  onClose: () => void;
  onRaceAdded: () => void;
}

export function AddRaceModal({ open, onClose, onRaceAdded }: AddRaceModalProps) {
  const router = useRouter();
  const [distances, setDistances] = useState<RaceDistanceWithEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchDistances();
      setSelectedRace(null);
      setSearchQuery("");
    }
  }, [open]);

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
      toast.error("Failed to load races");
    } else {
      setDistances(data || []);
    }
    setLoading(false);
  }

  async function handleSelectDistance(distance: RaceDistanceWithEdition) {
    setCreating(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to add a race");
        setCreating(false);
        return;
      }

      // Check if user already has a plan for this distance
      const { data: existingPlan } = await supabase
        .from("race_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("race_distance_id", distance.id)
        .single();

      if (existingPlan) {
        toast.info("You already have a plan for this race");
        router.push(`/dashboard/race/${existingPlan.id}`);
        onClose();
        setCreating(false);
        return;
      }

      // Create race plan
      const { data: plan, error: planError } = await supabase
        .from("race_plans")
        .insert({
          user_id: user.id,
          race_id: distance.race_edition.race.id,
          race_edition_id: distance.race_edition.id,
          race_distance_id: distance.id,
          created_by: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (planError) {
        throw planError;
      }

      toast.success("Race added! Let's build your plan.");
      router.push(`/dashboard/race/${plan.id}`);
      onRaceAdded();
    } catch (error) {
      console.error("Error creating race plan:", error);
      toast.error("Failed to add race. Please try again.");
    }

    setCreating(false);
  }

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {selectedRace ? "Select Distance" : "Add Race"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="space-y-4 p-1">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {/* Distance Selection (Step 2) */}
          {!loading && selectedRace && (
            <div className="space-y-4 p-1">
              <button
                onClick={handleBackToRaces}
                className="flex items-center gap-1 text-sm text-brand-navy-600 hover:text-brand-navy-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to races
              </button>

              {/* Race info */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-brand-sky-50 to-brand-navy-50 border border-brand-sky-200">
                <h3 className="font-bold text-brand-navy-900">{selectedRace.name}</h3>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-brand-navy-600">
                  {selectedRace.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedRace.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {selectedRace.year}
                  </span>
                </div>
              </div>

              {/* Distance options */}
              <div className="space-y-3">
                {selectedRace.distances.map((distance) => {
                  const displayName = distance.name || `${distance.distance_miles} mi`;

                  return (
                    <button
                      key={distance.id}
                      onClick={() => handleSelectDistance(distance)}
                      disabled={creating}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border-2 border-brand-navy-200 hover:border-brand-sky-400 hover:bg-brand-navy-50 transition-all",
                        creating && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-brand-navy-900">
                            {displayName}
                          </h4>
                          <p className="text-lg font-bold text-brand-navy-900">
                            {distance.distance_miles} mi
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-brand-navy-600">
                            {distance.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(distance.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                            {distance.elevation_gain && (
                              <span className="flex items-center gap-1">
                                <Mountain className="h-3.5 w-3.5" />
                                {distance.elevation_gain.toLocaleString()} ft
                              </span>
                            )}
                          </div>
                        </div>
                        {creating && (
                          <Loader2 className="h-5 w-5 animate-spin text-brand-sky-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Race Selection (Step 1) */}
          {!loading && !selectedRace && (
            <div className="space-y-4 p-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
                <Input
                  placeholder="Search races..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Race list */}
              <div className="space-y-3">
                {filteredRaces.map((race) => {
                  const distanceRange = race.distances.length > 1
                    ? `${Math.min(...race.distances.map(d => d.distance_miles))}-${Math.max(...race.distances.map(d => d.distance_miles))} mi`
                    : `${race.distances[0]?.distance_miles} mi`;

                  return (
                    <button
                      key={race.id}
                      onClick={() => setSelectedRace(race)}
                      className="w-full text-left p-4 rounded-lg border-2 border-brand-navy-200 hover:border-brand-sky-400 hover:bg-brand-navy-50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-brand-navy-900 group-hover:text-brand-sky-700 transition-colors">
                            {race.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-3 text-sm text-brand-navy-600">
                            {race.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {race.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {race.year}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-navy-100 text-xs font-medium text-brand-navy-700">
                              <Route className="h-3 w-3" />
                              {distanceRange}
                            </span>
                            <span className="text-xs text-brand-navy-500">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
