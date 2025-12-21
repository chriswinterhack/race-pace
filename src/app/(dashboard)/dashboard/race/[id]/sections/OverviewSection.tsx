"use client";

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
  Gauge,
  Car,
  Package,
  Backpack,
  AlertTriangle,
  Cloud,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

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
  aid_stations: Array<{ name: string; mile: number; cutoff?: string }> | null;
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
  race_distance: RaceDistance;
}

interface OverviewSectionProps {
  plan: RacePlan;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export function OverviewSection({ plan }: OverviewSectionProps) {
  const distance = plan.race_distance;
  const race = distance?.race_edition?.race;

  const surfaceComposition = distance?.surface_composition;
  const aidStations = distance?.aid_stations || [];

  return (
    <div className="space-y-8">
      {/* Race Description */}
      {race?.description && (
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900 mb-3">About the Race</h3>
          <p className="text-brand-navy-600 leading-relaxed">{race.description}</p>
        </div>
      )}

      {/* Key Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Date & Time */}
        {distance?.date && (
          <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
            <div className="flex items-center gap-2 text-brand-navy-500 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Date</span>
            </div>
            <p className="text-brand-navy-900 font-semibold">
              {new Date(distance.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        )}

        {distance?.start_time && (
          <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
            <div className="flex items-center gap-2 text-brand-navy-500 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Start Time</span>
            </div>
            <p className="text-brand-navy-900 font-semibold">{distance.start_time}</p>
            {distance.wave_info && (
              <p className="text-sm text-brand-navy-500 mt-1">{distance.wave_info}</p>
            )}
          </div>
        )}

        {race?.location && (
          <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
            <div className="flex items-center gap-2 text-brand-navy-500 mb-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <p className="text-brand-navy-900 font-semibold">{race.location}</p>
          </div>
        )}

        {/* Distance */}
        <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
          <div className="flex items-center gap-2 text-brand-navy-500 mb-2">
            <Route className="h-4 w-4" />
            <span className="text-sm font-medium">Distance</span>
          </div>
          {(() => {
            const effectiveMiles = distance.gpx_distance_miles ?? distance.distance_miles;
            const effectiveKm = Math.round(effectiveMiles * 1.60934 * 100) / 100;
            return (
              <p className="text-brand-navy-900 font-semibold">
                {effectiveMiles} miles
                <span className="text-brand-navy-500 font-normal ml-2">
                  ({effectiveKm} km)
                </span>
              </p>
            );
          })()}
        </div>

        {/* Elevation */}
        {distance?.elevation_gain && (
          <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
            <div className="flex items-center gap-2 text-brand-navy-500 mb-2">
              <Mountain className="h-4 w-4" />
              <span className="text-sm font-medium">Elevation</span>
            </div>
            <p className="text-brand-navy-900 font-semibold">
              +{distance.elevation_gain.toLocaleString()} ft
              {distance.elevation_loss && (
                <span className="text-brand-navy-500 font-normal ml-2">
                  / -{distance.elevation_loss.toLocaleString()} ft
                </span>
              )}
            </p>
            {(distance.elevation_high || distance.elevation_low) && (
              <p className="text-sm text-brand-navy-500 mt-1">
                {distance.elevation_low && `Low: ${distance.elevation_low.toLocaleString()} ft`}
                {distance.elevation_low && distance.elevation_high && " · "}
                {distance.elevation_high && `High: ${distance.elevation_high.toLocaleString()} ft`}
              </p>
            )}
          </div>
        )}

        {/* Time Limit */}
        {distance?.time_limit_minutes && (
          <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
            <div className="flex items-center gap-2 text-brand-navy-500 mb-2">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">Time Limit</span>
            </div>
            <p className="text-brand-navy-900 font-semibold">
              {formatMinutes(distance.time_limit_minutes)}
            </p>
          </div>
        )}

        {/* Participant Limit */}
        {distance?.participant_limit && (
          <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
            <div className="flex items-center gap-2 text-brand-navy-500 mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Participant Limit</span>
            </div>
            <p className="text-brand-navy-900 font-semibold">
              {distance.participant_limit.toLocaleString()} riders
            </p>
          </div>
        )}
      </div>

      {/* Surface Composition */}
      {surfaceComposition && Object.keys(surfaceComposition).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900 mb-4">Surface Composition</h3>
          <div className="flex gap-2 h-4 rounded-full overflow-hidden bg-brand-navy-100">
            {Object.entries(surfaceComposition)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([surface, percent]) => {
                const colors: Record<string, string> = {
                  gravel: "bg-amber-500",
                  dirt: "bg-orange-600",
                  pavement: "bg-gray-500",
                  singletrack: "bg-green-600",
                  sand: "bg-yellow-400",
                  mud: "bg-stone-600",
                };
                return (
                  <div
                    key={surface}
                    className={colors[surface.toLowerCase()] || "bg-brand-navy-400"}
                    style={{ width: `${percent}%` }}
                    title={`${surface}: ${percent}%`}
                  />
                );
              })}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {Object.entries(surfaceComposition)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([surface, percent]) => (
                <div key={surface} className="flex items-center gap-2 text-sm">
                  <Gauge className="h-3.5 w-3.5 text-brand-navy-400" />
                  <span className="capitalize text-brand-navy-700">{surface}:</span>
                  <span className="font-medium text-brand-navy-900">{percent}%</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Aid Stations */}
      {aidStations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900 mb-4">Aid Stations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-navy-200">
                  <th className="text-left py-2 px-3 font-medium text-brand-navy-500">Station</th>
                  <th className="text-right py-2 px-3 font-medium text-brand-navy-500">Mile</th>
                  {aidStations.some((s) => s.cutoff) && (
                    <th className="text-right py-2 px-3 font-medium text-brand-navy-500">Cutoff</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {aidStations.map((station, index) => (
                  <tr
                    key={index}
                    className="border-b border-brand-navy-100 hover:bg-brand-navy-50"
                  >
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-brand-sky-500" />
                        <span className="font-medium text-brand-navy-900">{station.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-2 px-3 text-brand-navy-700">
                      {station.mile.toFixed(1)} mi
                    </td>
                    {aidStations.some((s) => s.cutoff) && (
                      <td className="text-right py-2 px-3 text-brand-navy-700">
                        {station.cutoff || "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Race Day Logistics Section */}
      {(race?.parking_info || race?.packet_pickup?.length || race?.event_schedule?.length ||
        race?.crew_info || race?.crew_locations?.length || race?.drop_bag_info ||
        race?.course_rules || race?.course_marking || race?.weather_notes || race?.additional_info) && (
        <div className="space-y-6 pt-4 border-t border-brand-navy-100">
          <h3 className="text-xl font-semibold text-brand-navy-900">Race Day Logistics</h3>

          {/* Packet Pickup */}
          {race?.packet_pickup && race.packet_pickup.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-brand-sky-500" />
                <h4 className="font-semibold text-brand-navy-900">Packet Pickup</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {race.packet_pickup.map((pickup, index) => (
                  <div key={index} className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
                    <p className="font-medium text-brand-navy-900">
                      {new Date(pickup.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-brand-navy-700">
                      {pickup.start_time.slice(0, 5)} - {pickup.end_time.slice(0, 5)}
                    </p>
                    <p className="text-sm text-brand-navy-600 mt-1">{pickup.location}</p>
                    {pickup.notes && (
                      <p className="text-sm text-brand-navy-500 mt-1">{pickup.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Schedule */}
          {race?.event_schedule && race.event_schedule.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-sky-500" />
                <h4 className="font-semibold text-brand-navy-900">Race Day Schedule</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {race.event_schedule.map((item, index) => (
                      <tr key={index} className="border-b border-brand-navy-100 last:border-b-0">
                        <td className="py-2 pr-4 font-mono text-brand-navy-600 whitespace-nowrap">
                          {item.time}
                        </td>
                        <td className="py-2 font-medium text-brand-navy-900">{item.title}</td>
                        {item.description && (
                          <td className="py-2 pl-4 text-brand-navy-600">{item.description}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parking */}
          {race?.parking_info && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-brand-sky-500" />
                <h4 className="font-semibold text-brand-navy-900">Parking</h4>
              </div>
              <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
                <p className="text-brand-navy-700 whitespace-pre-line">{race.parking_info}</p>
              </div>
            </div>
          )}

          {/* Crew Information */}
          {(race?.crew_info || (race?.crew_locations && race.crew_locations.length > 0)) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-sky-500" />
                <h4 className="font-semibold text-brand-navy-900">Crew Access</h4>
              </div>

              {race?.crew_locations && race.crew_locations.length > 0 && (
                <div className="grid gap-3">
                  {race.crew_locations.map((loc, index) => (
                    <div key={index} className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-brand-navy-900">{loc.name}</p>
                          <p className="text-sm text-brand-navy-600">
                            Mile {loc.mile_out}
                            {loc.mile_in && loc.mile_in !== loc.mile_out && ` (return: ${loc.mile_in})`}
                          </p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full",
                          loc.access_type === "unlimited" && "bg-green-100 text-green-700",
                          loc.access_type === "limited" && "bg-amber-100 text-amber-700",
                          loc.access_type === "reserved" && "bg-red-100 text-red-700"
                        )}>
                          {loc.access_type === "unlimited" && "Open Access"}
                          {loc.access_type === "limited" && "Limited Access"}
                          {loc.access_type === "reserved" && "Reserved Only"}
                        </span>
                      </div>

                      {(loc.parking_info || loc.setup_time || loc.shuttle_info) && (
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-brand-navy-600">
                          {loc.parking_info && <span>Parking: {loc.parking_info}</span>}
                          {loc.setup_time && <span>Setup: {loc.setup_time}</span>}
                          {loc.shuttle_info && <span>Shuttle: {loc.shuttle_info}</span>}
                        </div>
                      )}

                      {loc.restrictions && (
                        <p className="mt-2 text-sm text-amber-700">
                          <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
                          {loc.restrictions}
                        </p>
                      )}

                      {loc.notes && (
                        <p className="mt-2 text-sm text-brand-navy-600">{loc.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {race?.crew_info && (
                <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
                  <p className="text-brand-navy-700 whitespace-pre-line">{race.crew_info}</p>
                </div>
              )}
            </div>
          )}

          {/* Drop Bags */}
          {race?.drop_bag_info && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Backpack className="h-5 w-5 text-brand-sky-500" />
                <h4 className="font-semibold text-brand-navy-900">Drop Bags</h4>
              </div>
              <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
                <p className="text-brand-navy-700 whitespace-pre-line">{race.drop_bag_info}</p>
              </div>
            </div>
          )}

          {/* Course Rules */}
          {race?.course_rules && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h4 className="font-semibold text-brand-navy-900">Important Rules</h4>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-brand-navy-700 whitespace-pre-line">{race.course_rules}</p>
              </div>
            </div>
          )}

          {/* Course Marking */}
          {race?.course_marking && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-brand-sky-500" />
                <h4 className="font-semibold text-brand-navy-900">Course Marking</h4>
              </div>
              <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
                <p className="text-brand-navy-700 whitespace-pre-line">{race.course_marking}</p>
              </div>
            </div>
          )}

          {/* Weather */}
          {race?.weather_notes && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-brand-sky-500" />
                <h4 className="font-semibold text-brand-navy-900">Weather & Conditions</h4>
              </div>
              <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
                <p className="text-brand-navy-700 whitespace-pre-line">{race.weather_notes}</p>
              </div>
            </div>
          )}

          {/* Additional Info */}
          {race?.additional_info && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-brand-sky-500" />
                <h4 className="font-semibold text-brand-navy-900">Additional Information</h4>
              </div>
              <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-100">
                <p className="text-brand-navy-700 whitespace-pre-line">{race.additional_info}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registration Link */}
      {distance?.registration_url && (
        <div className="flex justify-center pt-4">
          <Button asChild variant="outline">
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
