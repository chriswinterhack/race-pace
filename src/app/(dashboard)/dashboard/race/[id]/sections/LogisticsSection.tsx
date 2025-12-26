"use client";

import { useState, useEffect } from "react";
import {
  Backpack,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Package,
} from "lucide-react";
import { Button, Skeleton, RichTextDisplay } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { usePremiumFeature } from "@/hooks/useSubscription";
import type { DropBagLocation, DropBagPass } from "@/types/logistics";
import type { AidStation } from "@/types";
import { useLogisticsPlannerStore } from "@/components/logistics/stores/logisticsPlannerStore";
import { DropBagPlanner } from "@/components/logistics/drop-bag/DropBagPlanner";
import { CrewPlanner } from "@/components/logistics/crew/CrewPlanner";

// Helper to strip direction suffix from station name for grouping
function getDropBagKey(station: AidStation): string {
  // If explicit drop_bag_name is set, use it
  if (station.drop_bag_name) {
    return station.drop_bag_name;
  }
  // Otherwise, strip common direction suffixes from station name
  return station.name
    .replace(/\s*\(Outbound\)\s*$/i, "")
    .replace(/\s*\(Inbound\)\s*$/i, "")
    .replace(/\s*- Outbound\s*$/i, "")
    .replace(/\s*- Inbound\s*$/i, "")
    .trim();
}

// Helper to format time in AM/PM format
function formatTimeAmPm(time24: string): string {
  const [hourStr, minStr] = time24.split(":");
  let hour = parseInt(hourStr || "0", 10);
  const min = minStr || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${min} ${ampm}`;
}

// Helper to group aid stations by drop bag name for out-and-back courses
function groupStationsByDropBag(
  stations: AidStation[],
  getArrivalTime: (mile: number) => string | null
): DropBagLocation[] {
  // Group by drop_bag_name (or cleaned station name if not set)
  const groupMap = new Map<string, AidStation[]>();

  stations.forEach((station) => {
    const key = getDropBagKey(station);
    const existing = groupMap.get(key) || [];
    existing.push(station);
    groupMap.set(key, existing);
  });

  // Convert groups to DropBagLocation objects
  const locations: DropBagLocation[] = [];

  groupMap.forEach((stationGroup, dropBagName) => {
    // Sort by mile to ensure consistent ordering
    stationGroup.sort((a, b) => a.mile - b.mile);

    // Build passes array
    const passes: DropBagPass[] = stationGroup.map((station) => ({
      mile: station.mile,
      name: station.name,
      direction: station.pass_direction || "single",
      arrival_time: getArrivalTime(station.mile) || undefined,
      cutoff_time: station.cutoff_time ? formatTimeAmPm(station.cutoff_time) : undefined,
      supplies: station.supplies,
      is_crew_access: station.is_crew_access || false,
    }));

    // Use first station for primary fields
    const firstStation = stationGroup[0]!;

    // Combine supplies from all passes (unique)
    const allSupplies = new Set<string>();
    stationGroup.forEach((s) => s.supplies?.forEach((sup) => allSupplies.add(sup)));

    locations.push({
      drop_bag_name: dropBagName,
      passes,
      items: [],
      notes: firstStation.drop_bag_notes,
      // Legacy fields for backward compatibility
      mile: firstStation.mile,
      name: firstStation.name,
      arrival_time: getArrivalTime(firstStation.mile) || undefined,
      cutoff_time: firstStation.cutoff_time ? formatTimeAmPm(firstStation.cutoff_time) : undefined,
      is_drop_bag: true,
      is_crew_access: stationGroup.some((s) => s.is_crew_access),
      supplies: allSupplies.size > 0 ? Array.from(allSupplies) : undefined,
    });
  });

  // Sort by first pass mile
  return locations.sort((a, b) => a.passes[0]!.mile - b.passes[0]!.mile);
}

interface CrewLocation {
  name: string;
  mile_out: number;
  mile_in?: number;
  access_type: "unlimited" | "limited" | "reserved";
  parking_info?: string;
  setup_time?: string;
  shuttle_info?: string;
  notes?: string;
  restrictions?: string;
}

interface RacePlan {
  id: string;
  goal_time_minutes: number | null;
  start_time: string | null; // User's start time (HH:MM format)
  race_distance: {
    id: string;
    distance_miles: number;
    start_time: string | null; // Official race start time
    aid_stations: AidStation[] | null;
    race_edition: {
      race: {
        id: string;
        name: string;
        crew_locations: CrewLocation[] | null;
        crew_info: string | null;
        drop_bag_info: string | null;
      };
    };
  };
  segments: Array<{
    start_mile: number;
    end_mile: number;
    target_time_minutes: number;
  }>;
}

interface LogisticsSectionProps {
  plan: RacePlan;
}

type LogisticsTab = "dropbag" | "crew";

export function LogisticsSection({ plan }: LogisticsSectionProps) {
  const [activeTab, setActiveTab] = useState<LogisticsTab>("dropbag");
  const [loading, setLoading] = useState(true);
  const { canAccess: isPremium, isLoading: isPremiumLoading, showUpgrade } = usePremiumFeature("Logistics Planner");

  const {
    dropBagLocations,
    setDropBagLocations,
    setDropBagPlanId,
    setCrewPlanId,
    setLoading: setStoreLoading,
  } = useLogisticsPlannerStore();

  const supabase = createClient();
  const race = plan.race_distance?.race_edition?.race;
  const aidStations = plan.race_distance?.aid_stations || [];
  const crewLocations = race?.crew_locations || [];

  // Filter aid stations that are drop bag locations
  const dropBagStations = aidStations.filter((station) => station.is_drop_bag);

  // Filter aid stations that have crew access
  const crewAccessStations = aidStations.filter((station) => station.is_crew_access);

  useEffect(() => {
    if (isPremium && !isPremiumLoading) {
      loadLogisticsData();
    } else if (!isPremiumLoading) {
      setLoading(false);
    }
  }, [plan.id, isPremium, isPremiumLoading]);

  async function loadLogisticsData() {
    setLoading(true);
    setStoreLoading(true);

    try {
      // Load drop bag plan
      const { data: dropBagPlan } = await supabase
        .from("user_drop_bag_plans")
        .select("id")
        .eq("race_plan_id", plan.id)
        .single();

      // Build grouped locations from aid stations
      const groupedLocations = groupStationsByDropBag(dropBagStations, getArrivalTime);

      if (dropBagPlan) {
        setDropBagPlanId(dropBagPlan.id);

        // Load drop bag items
        const { data: items } = await supabase
          .from("drop_bag_items")
          .select("*")
          .eq("drop_bag_plan_id", dropBagPlan.id)
          .order("sort_order");

        // Add items to grouped locations by drop_bag_name (location_name in DB)
        if (items) {
          groupedLocations.forEach((location) => {
            // Match items by drop_bag_name OR by location_name (legacy)
            location.items = items.filter(
              (item) =>
                item.location_name === location.drop_bag_name ||
                location.passes.some((p) => p.name === item.location_name)
            );
          });
        }

        setDropBagLocations(groupedLocations);
      } else {
        // Initialize empty locations
        setDropBagLocations(groupedLocations);
      }

      // Load crew plan
      const { data: crewPlan } = await supabase
        .from("user_crew_plans")
        .select("id")
        .eq("race_plan_id", plan.id)
        .single();

      if (crewPlan) {
        setCrewPlanId(crewPlan.id);
      }
    } catch (error) {
      console.error("Error loading logistics data:", error);
    }

    setLoading(false);
    setStoreLoading(false);
  }

  // Get effective start time (user's or official race start)
  const effectiveStartTime = plan.start_time || plan.race_distance?.start_time;

  // Format start time to AM/PM for display
  const formattedStartTime = effectiveStartTime
    ? (() => {
        const [hour, min] = effectiveStartTime.split(":").map(Number);
        const ampm = (hour || 0) >= 12 ? "PM" : "AM";
        const displayHour = (hour || 0) % 12 || 12;
        return `${displayHour}:${(min || 0).toString().padStart(2, "0")} ${ampm}`;
      })()
    : null;

  // Calculate arrival time at a mile marker based on segments
  // Returns actual clock time in AM/PM format if start time is available
  function getArrivalTime(mile: number): string | null {
    if (!plan.goal_time_minutes || !plan.segments.length) return null;

    let totalMinutes = 0;
    for (const segment of plan.segments) {
      if (mile <= segment.start_mile) break;
      if (mile >= segment.end_mile) {
        totalMinutes += segment.target_time_minutes;
      } else {
        // Partial segment
        const segmentMiles = segment.end_mile - segment.start_mile;
        const milesInSegment = mile - segment.start_mile;
        totalMinutes += (milesInSegment / segmentMiles) * segment.target_time_minutes;
        break;
      }
    }

    // If we have a start time, calculate actual clock time
    if (effectiveStartTime) {
      const [startHour, startMin] = effectiveStartTime.split(":").map(Number);
      const startTotalMinutes = (startHour || 0) * 60 + (startMin || 0);
      const arrivalTotalMinutes = startTotalMinutes + totalMinutes;

      // Handle day overflow (arrival next day)
      const arrivalHour = Math.floor(arrivalTotalMinutes / 60) % 24;
      const arrivalMin = Math.round(arrivalTotalMinutes % 60);

      const ampm = arrivalHour >= 12 ? "PM" : "AM";
      const displayHour = arrivalHour % 12 || 12;
      return `${displayHour}:${arrivalMin.toString().padStart(2, "0")} ${ampm}`;
    }

    // Fallback to elapsed time if no start time
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  }

  // Check if race has any logistics locations defined
  const hasDropBagLocations = dropBagStations.length > 0;
  const hasCrewLocations = crewAccessStations.length > 0 || crewLocations.length > 0;

  // Show premium gate if not subscribed
  if (!isPremium && !isPremiumLoading) {
    return (
      <LogisticsPremiumGate
        showUpgrade={showUpgrade}
        hasDropBagLocations={hasDropBagLocations}
        hasCrewLocations={hasCrewLocations}
        dropBagCount={dropBagStations.length}
        crewCount={crewAccessStations.length + crewLocations.length}
      />
    );
  }

  if (loading || isPremiumLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-brand-navy-50 rounded-xl">
        <button
          onClick={() => setActiveTab("dropbag")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
            activeTab === "dropbag"
              ? "bg-white text-brand-navy-900 shadow-sm"
              : "text-brand-navy-600 hover:text-brand-navy-900"
          )}
        >
          <Backpack className="h-4 w-4" />
          Drop Bags
          {hasDropBagLocations && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-brand-sky-100 text-brand-sky-700">
              {dropBagStations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("crew")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
            activeTab === "crew"
              ? "bg-white text-brand-navy-900 shadow-sm"
              : "text-brand-navy-600 hover:text-brand-navy-900"
          )}
        >
          <Users className="h-4 w-4" />
          Crew Planning
          {hasCrewLocations && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
              {crewAccessStations.length + crewLocations.length}
            </span>
          )}
        </button>
      </div>

      {/* Drop Bag Tab */}
      {activeTab === "dropbag" && (
        <DropBagTab
          race={race}
          hasDropBagLocations={hasDropBagLocations}
          dropBagLocations={dropBagLocations}
          getArrivalTime={getArrivalTime}
          distanceMiles={plan.race_distance?.distance_miles}
          racePlanId={plan.id}
          startTime={formattedStartTime}
          finishTime={getArrivalTime(plan.race_distance?.distance_miles || 100)}
        />
      )}

      {/* Crew Tab */}
      {activeTab === "crew" && (
        <CrewTab
          race={race}
          hasCrewLocations={hasCrewLocations}
          crewLocations={crewLocations}
          crewAccessStations={crewAccessStations}
          getArrivalTime={getArrivalTime}
          distanceMiles={plan.race_distance?.distance_miles}
          racePlanId={plan.id}
          startTime={formattedStartTime}
          finishTime={getArrivalTime(plan.race_distance?.distance_miles || 100)}
        />
      )}
    </div>
  );
}

// Premium Gate Component
function LogisticsPremiumGate({
  showUpgrade,
  hasDropBagLocations,
  hasCrewLocations,
  dropBagCount,
  crewCount,
}: {
  showUpgrade: () => void;
  hasDropBagLocations: boolean;
  hasCrewLocations: boolean;
  dropBagCount: number;
  crewCount: number;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">
            Drop Bag & Crew Planning
          </h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            Plan your race logistics with visual tools and printable checklists
          </p>
        </div>
      </div>

      {/* Preview Container */}
      <div className="relative rounded-2xl border-2 border-brand-navy-200 overflow-hidden bg-white">
        <div className="p-6 space-y-6">
          {/* Preview tabs */}
          <div className="flex items-center gap-2 p-1 bg-brand-navy-50 rounded-xl">
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-white text-brand-navy-900 shadow-sm">
              <Backpack className="h-4 w-4" />
              Drop Bags
              {hasDropBagLocations && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-brand-sky-100 text-brand-sky-700">
                  {dropBagCount}
                </span>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-brand-navy-600">
              <Users className="h-4 w-4" />
              Crew Planning
              {hasCrewLocations && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                  {crewCount}
                </span>
              )}
            </div>
          </div>

          {/* Preview Timeline */}
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-sky-400 via-brand-sky-300 to-brand-sky-200" />

            <div className="space-y-4">
              {/* Start */}
              <div className="flex items-center gap-4">
                <div className="relative z-10 h-12 w-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-brand-navy-900">Start</p>
                  <p className="text-sm text-brand-navy-500">Mile 0</p>
                </div>
              </div>

              {/* Sample Locations */}
              {[
                { mile: 25, name: "Aid Station 1", items: 3 },
                { mile: 50, name: "Aid Station 2", items: 5 },
                { mile: 75, name: "Aid Station 3", items: 2 },
              ].map((loc) => (
                <div key={loc.mile} className="flex items-start gap-4">
                  <div className="relative z-10 h-12 w-12 rounded-full bg-brand-sky-500 flex items-center justify-center shadow-lg">
                    <Backpack className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 bg-white border border-brand-navy-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-brand-navy-900">{loc.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-brand-navy-500">
                          <span>Mile {loc.mile}</span>
                          <span className="text-brand-navy-300">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            ETA 3:45:00
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-brand-navy-100">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-brand-navy-400" />
                        <span className="text-sm text-brand-navy-600">{loc.items} items</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Finish */}
              <div className="flex items-center gap-4">
                <div className="relative z-10 h-12 w-12 rounded-full bg-brand-navy-900 flex items-center justify-center shadow-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-brand-navy-900">Finish</p>
                  <p className="text-sm text-brand-navy-500">Mile 100</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glass Overlay with CTA */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/60 flex items-center justify-center">
          <div className="text-center px-6 max-w-lg">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-sky-500 to-emerald-500 flex items-center justify-center mb-5 shadow-xl shadow-brand-sky-500/30">
              <Backpack className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-brand-navy-900 mb-3">
              Drop Bag & Crew Planning
            </h3>
            <p className="text-brand-navy-600 mb-6 text-lg">
              Visualize your logistics, create printable checklists, and generate crew guides.
            </p>

            <div className="grid grid-cols-2 gap-3 text-left mb-6 max-w-sm mx-auto">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Visual timeline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Drag & drop items</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Print checklists</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Crew guide PDF</span>
              </div>
            </div>

            <Button
              onClick={showUpgrade}
              size="lg"
              className="bg-gradient-to-r from-brand-sky-500 to-emerald-500 hover:from-brand-sky-600 hover:to-emerald-600 text-white shadow-lg shadow-brand-sky-500/25 gap-2 text-base px-8"
            >
              Unlock Logistics Planner
              <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="mt-4 text-sm text-brand-navy-500">
              Included with FinalClimb Premium • $29/year
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Drop Bag Tab Component
function DropBagTab({
  race,
  hasDropBagLocations,
  dropBagLocations,
  getArrivalTime,
  distanceMiles,
  racePlanId,
  startTime,
  finishTime,
}: {
  race: RacePlan["race_distance"]["race_edition"]["race"] | undefined;
  hasDropBagLocations: boolean;
  dropBagLocations: DropBagLocation[];
  getArrivalTime: (mile: number) => string | null;
  distanceMiles: number | undefined;
  racePlanId: string;
  startTime?: string | null;
  finishTime?: string | null;
}) {
  return (
    <div className="space-y-6">
      {/* Race Drop Bag Info */}
      {race?.drop_bag_info && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Race Drop Bag Instructions</p>
              <div className="mt-1 text-sm text-amber-800">
                <RichTextDisplay content={race.drop_bag_info} />
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasDropBagLocations ? (
        <EmptyState
          icon={Backpack}
          title="No Drop Bag Locations"
          description="This race doesn't have any designated drop bag locations, or they haven't been configured yet."
          hint="Check the race website for drop bag information, or contact the race organizer."
        />
      ) : (
        <DropBagPlanner
          racePlanId={racePlanId}
          locations={dropBagLocations}
          distanceMiles={distanceMiles || 100}
          startTime={startTime}
          finishTime={finishTime}
          getArrivalTime={getArrivalTime}
        />
      )}
    </div>
  );
}

// Crew Tab Component
function CrewTab({
  race,
  hasCrewLocations,
  crewLocations,
  crewAccessStations,
  getArrivalTime,
  distanceMiles,
  racePlanId,
  startTime,
  finishTime,
}: {
  race: RacePlan["race_distance"]["race_edition"]["race"] | undefined;
  hasCrewLocations: boolean;
  crewLocations: CrewLocation[];
  crewAccessStations: AidStation[];
  getArrivalTime: (mile: number) => string | null;
  distanceMiles: number | undefined;
  racePlanId: string;
  startTime?: string | null;
  finishTime?: string | null;
}) {
  if (!hasCrewLocations) {
    return (
      <EmptyState
        icon={Users}
        title="No Crew Access Points"
        description="This race doesn't have any designated crew access points, or they haven't been configured yet."
        hint="Some races don't allow crew support. Check the race rules for crew policies."
      />
    );
  }

  return (
    <CrewPlanner
      racePlanId={racePlanId}
      crewLocations={crewLocations}
      crewAccessStations={crewAccessStations}
      distanceMiles={distanceMiles || 100}
      startTime={startTime}
      finishTime={finishTime}
      getArrivalTime={getArrivalTime}
      raceCrewInfo={race?.crew_info}
    />
  );
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  hint,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  hint?: string;
}) {
  return (
    <div className="text-center py-12 px-6 bg-brand-navy-50 rounded-xl border border-dashed border-brand-navy-200">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand-navy-100 mb-4">
        <Icon className="h-8 w-8 text-brand-navy-400" />
      </div>
      <h4 className="text-lg font-semibold text-brand-navy-900">{title}</h4>
      <p className="mt-2 text-brand-navy-600 max-w-md mx-auto">{description}</p>
      {hint && <p className="mt-3 text-sm text-brand-navy-400">{hint}</p>}
    </div>
  );
}

