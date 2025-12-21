"use client";

import { useState, useEffect } from "react";
import { Users, Bike, Wrench, Cookie, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface RaceDistance {
  id: string;
  name: string | null;
  distance_miles: number;
  race_edition: {
    id: string;
    year: number;
    race: {
      id: string;
      name: string;
    };
  };
}

interface RacePlan {
  id: string;
  user_id: string;
  race_distance: RaceDistance;
}

interface ParticipantsSectionProps {
  plan: RacePlan;
}

interface Participant {
  id: string;
  displayName: string;
  gear: {
    bike?: string;
    tires?: string;
    repairKit?: string[];
  } | null;
}

export function ParticipantsSection({ plan }: ParticipantsSectionProps) {
  const distance = plan.race_distance;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchParticipants();
  }, [distance?.id]);

  async function fetchParticipants() {
    if (!distance?.id) return;

    setLoading(true);

    // Fetch all race plans for this distance (excluding current user's plan)
    const { data: plans, error: plansError } = await supabase
      .from("race_plans")
      .select(`
        id,
        user_id,
        user:users (
          id,
          email
        )
      `)
      .eq("race_distance_id", distance.id)
      .neq("id", plan.id);

    if (plansError) {
      console.error("Error fetching participants:", plansError);
      setLoading(false);
      return;
    }

    if (!plans || plans.length === 0) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    // Fetch gear setups for these participants
    const userIds = plans.map((p) => p.user_id);
    const { data: gearSetups } = await supabase
      .from("gear_setups")
      .select(`
        id,
        user_id,
        bike_brand,
        bike_model,
        bike_year,
        tire_brand,
        tire_model,
        tire_width,
        repair_kit_contents,
        is_public
      `)
      .in("user_id", userIds)
      .eq("race_id", distance.race_edition.race.id)
      .eq("is_public", true);

    // Fetch profiles for display names
    const { data: profiles } = await supabase
      .from("athlete_profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    // Build participant list
    const participantList: Participant[] = plans.map((p) => {
      const profile = profiles?.find((prof) => prof.user_id === p.user_id);
      const gear = gearSetups?.find((g) => g.user_id === p.user_id);
      // Supabase returns array for joins, get first item
      const userArray = p.user as Array<{ id: string; email: string }> | null;
      const user = userArray && userArray.length > 0 ? userArray[0] : null;

      let displayName = "Athlete";
      if (profile?.display_name) {
        displayName = profile.display_name;
      } else if (user?.email) {
        displayName = user.email.split("@")[0] || "Athlete";
      }

      return {
        id: p.user_id as string,
        displayName,
        gear: gear
          ? {
              bike: gear.bike_brand
                ? `${gear.bike_brand} ${gear.bike_model || ""} ${gear.bike_year || ""}`.trim()
                : undefined,
              tires: gear.tire_brand
                ? `${gear.tire_brand} ${gear.tire_model || ""} ${gear.tire_width ? `${gear.tire_width}mm` : ""}`.trim()
                : undefined,
              repairKit: gear.repair_kit_contents || undefined,
            }
          : null,
      };
    });

    setParticipants(participantList);
    setLoading(false);
  }

  const participantsWithGear = participants.filter((p) => p.gear !== null);
  const participantsWithoutGear = participants.filter((p) => p.gear === null);

  // Get gear stats
  const bikeStats: Record<string, number> = {};
  const tireStats: Record<string, number> = {};

  participantsWithGear.forEach((p) => {
    if (p.gear?.bike) {
      const brand = p.gear.bike.split(" ")[0] || "Unknown";
      bikeStats[brand] = (bikeStats[brand] || 0) + 1;
    }
    if (p.gear?.tires) {
      const brand = p.gear.tires.split(" ")[0] || "Unknown";
      tireStats[brand] = (tireStats[brand] || 0) + 1;
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">Participants</h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            See what gear other athletes are bringing to {distance?.race_edition?.race?.name}
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!loading && participants.length === 0 && (
        <div className="text-center py-12 bg-brand-navy-50 rounded-lg">
          <Users className="h-10 w-10 text-brand-navy-300 mx-auto mb-3" />
          <p className="text-brand-navy-600 mb-2">No other participants yet</p>
          <p className="text-sm text-brand-navy-500">
            You&apos;re the first to create a plan for this distance!
          </p>
        </div>
      )}

      {!loading && participants.length > 0 && (
        <>
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-brand-sky-50 border border-brand-sky-100">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-brand-sky-500" />
                <span className="text-sm font-medium text-brand-sky-700">Total Participants</span>
              </div>
              <p className="text-2xl font-bold text-brand-sky-900">
                {participants.length + 1}
              </p>
              <p className="text-xs text-brand-sky-600">including you</p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">Sharing Gear</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {participantsWithGear.length}
              </p>
              <p className="text-xs text-green-600">public gear setups</p>
            </div>

            <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
              <div className="flex items-center gap-2 mb-2">
                <EyeOff className="h-5 w-5 text-brand-navy-400" />
                <span className="text-sm font-medium text-brand-navy-600">Private</span>
              </div>
              <p className="text-2xl font-bold text-brand-navy-700">
                {participantsWithoutGear.length}
              </p>
              <p className="text-xs text-brand-navy-500">not sharing gear</p>
            </div>
          </div>

          {/* Popular Gear Choices */}
          {(Object.keys(bikeStats).length > 0 || Object.keys(tireStats).length > 0) && (
            <div>
              <h4 className="text-sm font-medium text-brand-navy-700 mb-4">Popular Choices</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.keys(bikeStats).length > 0 && (
                  <div className="p-4 rounded-lg bg-brand-navy-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Bike className="h-4 w-4 text-brand-navy-500" />
                      <span className="text-sm font-medium text-brand-navy-700">Bike Brands</span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(bikeStats)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([brand, count]) => (
                          <div key={brand} className="flex items-center justify-between text-sm">
                            <span className="text-brand-navy-700">{brand}</span>
                            <span className="font-medium text-brand-navy-900">
                              {count} rider{count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {Object.keys(tireStats).length > 0 && (
                  <div className="p-4 rounded-lg bg-brand-navy-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Cookie className="h-4 w-4 text-brand-navy-500" />
                      <span className="text-sm font-medium text-brand-navy-700">Tire Brands</span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(tireStats)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([brand, count]) => (
                          <div key={brand} className="flex items-center justify-between text-sm">
                            <span className="text-brand-navy-700">{brand}</span>
                            <span className="font-medium text-brand-navy-900">
                              {count} rider{count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participant List */}
          {participantsWithGear.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-brand-navy-700 mb-4">
                Gear Setups ({participantsWithGear.length})
              </h4>
              <div className="space-y-3">
                {participantsWithGear.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-4 rounded-lg border border-brand-navy-200 bg-white hover:border-brand-sky-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium text-brand-navy-900">
                          {participant.displayName}
                        </h5>
                        <div className="mt-2 space-y-1 text-sm text-brand-navy-600">
                          {participant.gear?.bike && (
                            <p className="flex items-center gap-2">
                              <Bike className="h-4 w-4 text-brand-navy-400" />
                              {participant.gear.bike}
                            </p>
                          )}
                          {participant.gear?.tires && (
                            <p className="flex items-center gap-2">
                              <Cookie className="h-4 w-4 text-brand-navy-400" />
                              {participant.gear.tires}
                            </p>
                          )}
                          {participant.gear?.repairKit && participant.gear.repairKit.length > 0 && (
                            <p className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-brand-navy-400" />
                              {participant.gear.repairKit.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Private Participants */}
          {participantsWithoutGear.length > 0 && (
            <div className="text-center py-6 bg-brand-navy-50 rounded-lg">
              <p className="text-sm text-brand-navy-500">
                {participantsWithoutGear.length} other participant{participantsWithoutGear.length !== 1 ? "s" : ""}{" "}
                {participantsWithoutGear.length !== 1 ? "haven't" : "hasn't"} shared their gear publicly
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
