"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Mountain,
  Timer,
  Users,
  ExternalLink,
  Flag,
  Route,
  Car,
  Package,
  Backpack,
  AlertTriangle,
  Cloud,
  Info,
  Pencil,
  Check,
  X,
  TrendingUp,
  Gauge,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button, Input, RichTextDisplay } from "@/components/ui";
import { cn, formatElevation, formatElevationPerDistance, getDisplayDistance, getDistanceUnit, getElevationUnit } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUnits } from "@/hooks";
import { toast } from "sonner";

interface RaceDistance {
  id: string;
  name: string | null;
  distance_miles: number;
  gpx_distance_miles: number | null;
  distance_km: number | null;
  date: string | null;
  start_time: string | null;
  wave_info: string | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  elevation_high: number | null;
  elevation_low: number | null;
  gpx_file_url: string | null;
  surface_composition: Record<string, number> | null;
  aid_stations: Array<{ name: string; mile: number; cutoff?: string; type?: "aid_station" | "checkpoint"; supplies?: string[] }> | null;
  time_limit_minutes: number | null;
  participant_limit: number | null;
  registration_url: string | null;
  race_edition: {
    id: string;
    year: number;
    race: {
      id: string;
      name: string;
      slug: string;
      location: string | null;
      description: string | null;
      parking_info: string | null;
      packet_pickup: { date: string; start_time: string; end_time: string; location: string; notes?: string }[] | null;
      event_schedule: { time: string; title: string; description?: string }[] | null;
      crew_info: string | null;
      crew_locations: { name: string; mile_out: number; mile_in?: number; access_type: "unlimited" | "limited" | "reserved"; parking_info?: string; setup_time?: string; shuttle_info?: string; notes?: string; restrictions?: string }[] | null;
      drop_bag_info: string | null;
      course_rules: string | null;
      course_marking: string | null;
      weather_notes: string | null;
      additional_info: string | null;
    };
  };
}

interface RacePlan {
  id: string;
  start_time: string | null;
  race_distance: RaceDistance;
}

interface OverviewSectionProps {
  plan: RacePlan;
  onUpdate?: () => void;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

// Surface colors with gradients for visual interest
const SURFACE_STYLES: Record<string, { bg: string; text: string; gradient: string }> = {
  gravel: { bg: "bg-amber-500", text: "text-amber-700", gradient: "from-amber-400 to-amber-600" },
  dirt: { bg: "bg-orange-600", text: "text-orange-700", gradient: "from-orange-500 to-orange-700" },
  pavement: { bg: "bg-slate-500", text: "text-slate-700", gradient: "from-slate-400 to-slate-600" },
  singletrack: { bg: "bg-emerald-600", text: "text-emerald-700", gradient: "from-emerald-500 to-emerald-700" },
  doubletrack: { bg: "bg-lime-600", text: "text-lime-700", gradient: "from-lime-500 to-lime-700" },
  sand: { bg: "bg-yellow-400", text: "text-yellow-700", gradient: "from-yellow-300 to-yellow-500" },
  mud: { bg: "bg-stone-600", text: "text-stone-700", gradient: "from-stone-500 to-stone-700" },
};

export function OverviewSection({ plan, onUpdate }: OverviewSectionProps) {
  const distance = plan.race_distance;
  const race = distance?.race_edition?.race;
  const supabase = createClient();
  const { units } = useUnits();

  const surfaceComposition = distance?.surface_composition;
  const aidStations = (distance?.aid_stations || []).filter(
    (s) => !s.type || s.type === "aid_station"
  );

  // State for editing start time
  const [editingStartTime, setEditingStartTime] = useState(false);
  const [startTimeValue, setStartTimeValue] = useState(
    plan.start_time?.slice(0, 5) || distance?.start_time?.slice(0, 5) || ""
  );
  const [savingStartTime, setSavingStartTime] = useState(false);

  const effectiveStartTime = plan.start_time || distance?.start_time;
  const hasCustomStartTime = plan.start_time !== null;

  // Calculate elevation stats
  const elevationHigh = distance?.elevation_high;
  const elevationLow = distance?.elevation_low;
  const elevationRange = elevationHigh && elevationLow ? elevationHigh - elevationLow : null;

  // Calculate effective distance
  const effectiveMiles = distance?.gpx_distance_miles ?? distance?.distance_miles ?? 0;

  // Calculate feet per mile
  const feetPerMile = distance?.elevation_gain && effectiveMiles
    ? Math.round(distance.elevation_gain / effectiveMiles)
    : null;

  async function handleSaveStartTime() {
    setSavingStartTime(true);
    const { error } = await supabase
      .from("race_plans")
      .update({ start_time: startTimeValue || null })
      .eq("id", plan.id);

    if (error) {
      toast.error("Failed to save start time");
      console.error(error);
    } else {
      toast.success("Start time updated");
      setEditingStartTime(false);
      onUpdate?.();
    }
    setSavingStartTime(false);
  }

  function handleCancelEdit() {
    setStartTimeValue(plan.start_time?.slice(0, 5) || distance?.start_time?.slice(0, 5) || "");
    setEditingStartTime(false);
  }

  // Format date nicely
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year!, month! - 1, day!);
    return {
      weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      day: day,
      year: year,
      full: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };
  };

  return (
    <div className="space-y-10">
      {/* Race Description - Editorial Style */}
      {race?.description && (
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-sky-400 to-brand-sky-600 rounded-full" />
          <p className="text-lg text-brand-navy-700 leading-relaxed pl-4 italic">
            {race.description}
          </p>
        </div>
      )}

      {/* Hero Stats - Large, Dramatic Cards with Staggered Animation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Distance Card */}
        <div
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0ms" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-sky-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <Route className="h-5 w-5 text-brand-sky-400 mb-3" />
          <p className="text-sm font-medium text-white/60 uppercase tracking-wide">Distance</p>
          <p className="text-3xl font-bold mt-1 font-mono tracking-tight">
            {units === "metric"
              ? Math.round(getDisplayDistance(effectiveMiles, units) * 10) / 10
              : effectiveMiles}
            <span className="text-lg font-normal text-white/60 ml-1">{getDistanceUnit(units)}</span>
          </p>
          <p className="text-sm text-white/50 mt-1">
            {units === "metric" ? `${effectiveMiles} mi` : `${Math.round(effectiveMiles * 1.60934 * 10) / 10} km`}
          </p>
        </div>

        {/* Elevation Card */}
        {distance?.elevation_gain && (
          <div
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] opacity-0 animate-fade-in-up"
            style={{ animationDelay: "75ms" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <Mountain className="h-5 w-5 text-emerald-200 mb-3" />
            <p className="text-sm font-medium text-white/60 uppercase tracking-wide">Elevation Gain</p>
            <p className="text-3xl font-bold mt-1 font-mono tracking-tight">
              {formatElevation(distance.elevation_gain, units, { includeUnit: false })}
              <span className="text-lg font-normal text-white/60 ml-1">{getElevationUnit(units)}</span>
            </p>
            {feetPerMile && (
              <p className="text-sm text-white/50 mt-1">{formatElevationPerDistance(feetPerMile, units)} avg</p>
            )}
          </div>
        )}

        {/* Start Time Card - Editable */}
        <div
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] opacity-0 animate-fade-in-up"
          style={{ animationDelay: "150ms" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <Clock className="h-5 w-5 text-violet-200 mb-3" />
            {!editingStartTime && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingStartTime(true);
                }}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/60 hover:text-white transition-colors z-10"
                aria-label="Edit start time"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm font-medium text-white/60 uppercase tracking-wide">Your Start</p>

          {editingStartTime ? (
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="time"
                value={startTimeValue}
                onChange={(e) => setStartTimeValue(e.target.value)}
                className="w-28 h-9 text-sm bg-white/20 border-white/30 text-white placeholder:text-white/50"
              />
              <button
                onClick={handleSaveStartTime}
                disabled={savingStartTime}
                className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors disabled:opacity-50"
                aria-label="Save"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={savingStartTime}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold mt-1 font-mono tracking-tight">
                {effectiveStartTime?.slice(0, 5) || "--:--"}
              </p>
              {!hasCustomStartTime && distance?.start_time && (
                <p className="text-sm text-white/50 mt-1">Set your wave time</p>
              )}
              {hasCustomStartTime && distance?.start_time && plan.start_time !== distance.start_time && (
                <p className="text-sm text-white/50 mt-1">Official: {distance.start_time.slice(0, 5)}</p>
              )}
            </>
          )}
        </div>

        {/* Time Limit or Date Card */}
        {distance?.time_limit_minutes ? (
          <div
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] opacity-0 animate-fade-in-up"
            style={{ animationDelay: "225ms" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <Timer className="h-5 w-5 text-amber-200 mb-3" />
            <p className="text-sm font-medium text-white/60 uppercase tracking-wide">Time Limit</p>
            <p className="text-3xl font-bold mt-1 font-mono tracking-tight">
              {formatMinutes(distance.time_limit_minutes)}
            </p>
            {effectiveStartTime && (
              <p className="text-sm text-white/50 mt-1">
                Cutoff: {(() => {
                  const [h, m] = effectiveStartTime.split(":").map(Number);
                  const totalMins = (h ?? 0) * 60 + (m ?? 0) + distance.time_limit_minutes;
                  const cutoffH = Math.floor(totalMins / 60) % 24;
                  const cutoffM = totalMins % 60;
                  return `${cutoffH.toString().padStart(2, "0")}:${cutoffM.toString().padStart(2, "0")}`;
                })()}
              </p>
            )}
          </div>
        ) : distance?.date ? (
          <div
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] opacity-0 animate-fade-in-up"
            style={{ animationDelay: "225ms" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <Calendar className="h-5 w-5 text-rose-200 mb-3" />
            <p className="text-sm font-medium text-white/60 uppercase tracking-wide">Race Day</p>
            <p className="text-3xl font-bold mt-1 font-mono tracking-tight">
              {formatDate(distance.date).month} {formatDate(distance.date).day}
            </p>
            <p className="text-sm text-white/50 mt-1">{formatDate(distance.date).weekday}</p>
          </div>
        ) : null}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {race?.location && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-navy-50 border border-brand-navy-100">
            <div className="p-2 rounded-lg bg-brand-sky-100">
              <MapPin className="h-4 w-4 text-brand-sky-600" />
            </div>
            <div>
              <p className="text-xs text-brand-navy-500 font-medium">Location</p>
              <p className="text-sm font-semibold text-brand-navy-900">{race.location}</p>
            </div>
          </div>
        )}

        {elevationRange && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-navy-50 border border-brand-navy-100">
            <div className="p-2 rounded-lg bg-emerald-100">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-brand-navy-500 font-medium">Elevation Range</p>
              <p className="text-sm font-semibold text-brand-navy-900">
                {formatElevation(elevationLow!, units, { includeUnit: false })} - {formatElevation(elevationHigh!, units)}
              </p>
            </div>
          </div>
        )}

        {distance?.participant_limit && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-navy-50 border border-brand-navy-100">
            <div className="p-2 rounded-lg bg-violet-100">
              <Users className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-brand-navy-500 font-medium">Field Size</p>
              <p className="text-sm font-semibold text-brand-navy-900">
                {distance.participant_limit.toLocaleString()} riders
              </p>
            </div>
          </div>
        )}

        {distance?.wave_info && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-navy-50 border border-brand-navy-100">
            <div className="p-2 rounded-lg bg-amber-100">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-brand-navy-500 font-medium">Wave</p>
              <p className="text-sm font-semibold text-brand-navy-900">{distance.wave_info}</p>
            </div>
          </div>
        )}
      </div>

      {/* Surface Composition - Visual Bar Chart */}
      {surfaceComposition && Object.keys(surfaceComposition).length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-brand-navy-50 to-white border border-brand-navy-100 p-6 shadow-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-brand-navy-900">
                <Gauge className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-brand-navy-900">Surface Composition</h3>
            </div>
          </div>

          {/* Stacked bar with animated fill */}
          <div className="relative h-10 rounded-xl overflow-hidden bg-brand-navy-100 shadow-inner">
            <div className="absolute inset-0 flex">
              {Object.entries(surfaceComposition)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([surface, percent], index) => {
                  const style = SURFACE_STYLES[surface.toLowerCase()] || { bg: "bg-brand-navy-400", gradient: "from-brand-navy-400 to-brand-navy-500" };
                  return (
                    <div
                      key={surface}
                      className={cn(
                        "relative h-full flex items-center justify-center overflow-hidden animate-bar-fill",
                        `bg-gradient-to-r ${style.gradient}`
                      )}
                      style={{
                        "--bar-width": `${percent}%`,
                        animationDelay: `${400 + index * 100}ms`,
                      } as React.CSSProperties}
                    >
                      {(percent as number) >= 15 && (
                        <span className="text-xs font-bold text-white/90 drop-shadow-sm opacity-0 animate-fade-in" style={{ animationDelay: `${600 + index * 100}ms` }}>
                          {percent}%
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
            {Object.entries(surfaceComposition)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([surface, percent]) => {
                const style = SURFACE_STYLES[surface.toLowerCase()] || { bg: "bg-brand-navy-400", text: "text-brand-navy-700" };
                return (
                  <div key={surface} className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", style.bg)} />
                    <span className="text-sm capitalize text-brand-navy-700">{surface}</span>
                    <span className="text-sm font-semibold text-brand-navy-900">{percent}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Aid Stations - Timeline Style */}
      {aidStations.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-brand-navy-50 to-white border border-brand-navy-100 p-6 shadow-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-brand-sky-500">
              <Flag className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-brand-navy-900">Aid Stations</h3>
            <span className="ml-auto text-sm text-brand-navy-500">{aidStations.length} stops</span>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-brand-sky-400 via-brand-sky-500 to-brand-sky-600" />

            <div className="space-y-4">
              {aidStations.map((station, index) => (
                <div
                  key={index}
                  className="relative flex items-start gap-4 group opacity-0 animate-slide-in-right"
                  style={{ animationDelay: `${500 + index * 75}ms` }}
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    "relative z-10 w-[54px] flex flex-col items-center flex-shrink-0",
                  )}>
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 border-brand-sky-500 bg-white transition-all duration-200",
                      "group-hover:scale-125 group-hover:bg-brand-sky-500"
                    )} />
                  </div>

                  {/* Station card */}
                  <div className="flex-1 pb-4">
                    <div className="p-4 rounded-xl bg-white border border-brand-navy-100 shadow-sm group-hover:shadow-md group-hover:border-brand-sky-200 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-brand-navy-900">{station.name}</p>
                          <p className="text-sm text-brand-navy-500 mt-0.5">
                            {units === "metric"
                              ? `Km ${(station.mile * 1.60934).toFixed(1)}`
                              : `Mile ${station.mile.toFixed(1)}`}
                          </p>
                        </div>
                        {station.cutoff && (
                          <div className="text-right">
                            <p className="text-xs text-brand-navy-500">Cutoff</p>
                            <p className="text-sm font-mono font-semibold text-amber-600">{station.cutoff}</p>
                          </div>
                        )}
                        <ChevronRight className="h-4 w-4 text-brand-navy-300 group-hover:text-brand-sky-500 transition-colors" />
                      </div>
                      {/* Supplies */}
                      {station.supplies && station.supplies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-brand-navy-100">
                          <p className="text-xs font-medium text-brand-navy-500 mb-1.5">Supplies</p>
                          <div className="flex flex-wrap gap-1.5">
                            {station.supplies.map((supply, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                              >
                                {supply}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Race Day Logistics - Grid of Cards */}
      {(race?.parking_info || race?.packet_pickup?.length || race?.event_schedule?.length ||
        race?.crew_info || race?.crew_locations?.length || race?.drop_bag_info ||
        race?.course_rules || race?.course_marking || race?.weather_notes || race?.additional_info) && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-navy-200 to-transparent" />
            <h3 className="text-lg font-semibold text-brand-navy-900 px-4">Race Day Logistics</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-navy-200 to-transparent" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Packet Pickup */}
            {race?.packet_pickup && race.packet_pickup.length > 0 && (
              <LogisticsCard
                icon={Package}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                title="Packet Pickup"
              >
                <div className="space-y-3">
                  {race.packet_pickup.map((pickup, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium text-brand-navy-900">
                        {formatDate(pickup.date).weekday}, {formatDate(pickup.date).month} {formatDate(pickup.date).day}
                      </p>
                      <p className="text-brand-navy-600">
                        {pickup.start_time.slice(0, 5)} - {pickup.end_time.slice(0, 5)}
                      </p>
                      <p className="text-brand-navy-500">{pickup.location}</p>
                      {pickup.notes && (
                        <p className="text-brand-navy-400 text-xs mt-1">{pickup.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </LogisticsCard>
            )}

            {/* Event Schedule */}
            {race?.event_schedule && race.event_schedule.length > 0 && (
              <LogisticsCard
                icon={Calendar}
                iconBg="bg-violet-100"
                iconColor="text-violet-600"
                title="Race Day Schedule"
              >
                <div className="space-y-2">
                  {race.event_schedule.map((item, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <span className="font-mono text-brand-navy-500 w-14 flex-shrink-0">{item.time}</span>
                      <div>
                        <span className="font-medium text-brand-navy-900">{item.title}</span>
                        {item.description && (
                          <span className="text-brand-navy-500 ml-1">{item.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </LogisticsCard>
            )}

            {/* Parking */}
            {race?.parking_info && (
              <LogisticsCard
                icon={Car}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
                title="Parking"
              >
                <RichTextDisplay content={race.parking_info} className="text-sm text-brand-navy-700" />
              </LogisticsCard>
            )}

            {/* Drop Bags */}
            {race?.drop_bag_info && (
              <LogisticsCard
                icon={Backpack}
                iconBg="bg-orange-100"
                iconColor="text-orange-600"
                title="Drop Bags"
              >
                <RichTextDisplay content={race.drop_bag_info} className="text-sm text-brand-navy-700" />
              </LogisticsCard>
            )}

            {/* Course Marking */}
            {race?.course_marking && (
              <LogisticsCard
                icon={Flag}
                iconBg="bg-pink-100"
                iconColor="text-pink-600"
                title="Course Marking"
              >
                <RichTextDisplay content={race.course_marking} className="text-sm text-brand-navy-700" />
              </LogisticsCard>
            )}

            {/* Weather */}
            {race?.weather_notes && (
              <LogisticsCard
                icon={Cloud}
                iconBg="bg-sky-100"
                iconColor="text-sky-600"
                title="Weather & Conditions"
              >
                <RichTextDisplay content={race.weather_notes} className="text-sm text-brand-navy-700" />
              </LogisticsCard>
            )}

            {/* Additional Info */}
            {race?.additional_info && (
              <LogisticsCard
                icon={Info}
                iconBg="bg-brand-navy-100"
                iconColor="text-brand-navy-600"
                title="Additional Information"
              >
                <RichTextDisplay content={race.additional_info} className="text-sm text-brand-navy-700" />
              </LogisticsCard>
            )}
          </div>

          {/* Course Rules - Full Width Warning Card */}
          {race?.course_rules && (
            <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-500 flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">Important Rules</h4>
                  <RichTextDisplay content={race.course_rules} className="text-sm text-amber-800" />
                </div>
              </div>
            </div>
          )}

          {/* Crew Information - Full Width */}
          {(race?.crew_info || (race?.crew_locations && race.crew_locations.length > 0)) && (
            <div className="rounded-2xl bg-white border border-brand-navy-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-lg bg-indigo-500">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-brand-navy-900">Crew Access Points</h4>
              </div>

              {race?.crew_locations && race.crew_locations.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  {race.crew_locations.map((loc, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-brand-navy-50 border border-brand-navy-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-brand-navy-900">{loc.name}</p>
                          <p className="text-sm text-brand-navy-600">
                            {units === "metric" ? "Km" : "Mile"} {units === "metric" ? (loc.mile_out * 1.60934).toFixed(1) : loc.mile_out}
                            {loc.mile_in && loc.mile_in !== loc.mile_out && ` → ${units === "metric" ? (loc.mile_in * 1.60934).toFixed(1) : loc.mile_in}`}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "px-2.5 py-1 text-xs font-semibold rounded-full",
                            loc.access_type === "unlimited" && "bg-emerald-100 text-emerald-700",
                            loc.access_type === "limited" && "bg-amber-100 text-amber-700",
                            loc.access_type === "reserved" && "bg-red-100 text-red-700"
                          )}
                        >
                          {loc.access_type === "unlimited" && "Open"}
                          {loc.access_type === "limited" && "Limited"}
                          {loc.access_type === "reserved" && "Reserved"}
                        </span>
                      </div>

                      {(loc.parking_info || loc.setup_time || loc.shuttle_info) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-navy-500 mt-2">
                          {loc.parking_info && <span>Parking: {loc.parking_info}</span>}
                          {loc.setup_time && <span>Setup: {loc.setup_time}</span>}
                          {loc.shuttle_info && <span>Shuttle: {loc.shuttle_info}</span>}
                        </div>
                      )}

                      {loc.restrictions && (
                        <p className="mt-2 text-xs text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 inline" />
                          {loc.restrictions}
                        </p>
                      )}

                      {loc.notes && (
                        <p className="mt-2 text-xs text-brand-navy-500">{loc.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {race?.crew_info && (
                <p className="text-sm text-brand-navy-700 whitespace-pre-line">{race.crew_info}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Registration Link */}
      {distance?.registration_url && (
        <div className="flex justify-center pt-4">
          <Button asChild className="rounded-xl px-6 bg-brand-navy-900 hover:bg-brand-navy-800">
            <a
              href={distance.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Registration
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

// Reusable Logistics Card Component
function LogisticsCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  children,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white border border-brand-navy-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2 rounded-lg", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <h4 className="font-semibold text-brand-navy-900">{title}</h4>
      </div>
      {children}
    </div>
  );
}
