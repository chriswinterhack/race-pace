/**
 * Shared types for admin race management
 */

export type PassDirection = "outbound" | "inbound" | "single";

export interface AidStation {
  id?: string; // For drag and drop tracking
  name: string;
  mile: number;
  supplies?: string[];
  cutoff_time?: string;
  type?: "aid_station" | "checkpoint";
  // Logistics flags
  is_drop_bag?: boolean;
  is_crew_access?: boolean;
  drop_bag_notes?: string;
  crew_notes?: string;
  // Linked drop bag support (for out-and-back courses)
  drop_bag_name?: string;
  pass_direction?: PassDirection;
}

export interface SurfaceComposition {
  gravel?: number;
  pavement?: number;
  singletrack?: number;
  doubletrack?: number;
  dirt?: number;
}

export type DistanceRaceType = "road" | "gravel" | "xc_mtb" | "ultra_mtb";

export interface RaceDistance {
  id: string;
  name: string | null;
  distance_miles: number;
  date: string | null;
  start_time: string | null;
  gpx_file_url: string | null;
  elevation_gain: number | null;
  is_active: boolean;
  sort_order: number;
  aid_stations: AidStation[] | null;
  surface_composition: SurfaceComposition | null;
  race_type: DistanceRaceType | null;
}

export interface RaceEdition {
  id: string;
  year: number;
  date: string | null;
  is_active: boolean;
  race_distances: RaceDistance[];
}

export interface RaceLogistics {
  parking_info?: string;
  packet_pickup?: { date: string; start_time: string; end_time: string; location: string; notes?: string }[];
  event_schedule?: { time: string; title: string; description?: string }[];
  crew_info?: string;
  crew_locations?: { name: string; mile_out: number; mile_in?: number; access_type: "unlimited" | "limited" | "reserved"; parking_info?: string; setup_time?: string; shuttle_info?: string; notes?: string; restrictions?: string }[];
  drop_bag_info?: string;
  course_rules?: string;
  course_marking?: string;
  weather_notes?: string;
  additional_info?: string;
}

export interface Race {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  website_url: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  race_type: "bike" | "run";
  race_subtype: string;
  race_editions: RaceEdition[];
  // Logistics fields
  parking_info: string | null;
  packet_pickup: RaceLogistics["packet_pickup"] | null;
  event_schedule: RaceLogistics["event_schedule"] | null;
  crew_info: string | null;
  crew_locations: RaceLogistics["crew_locations"] | null;
  drop_bag_info: string | null;
  course_rules: string | null;
  course_marking: string | null;
  weather_notes: string | null;
  additional_info: string | null;
}

export const RACE_TYPE_OPTIONS: { value: DistanceRaceType; label: string; description: string }[] = [
  { value: "road", label: "Road", description: "Road race with drafting" },
  { value: "gravel", label: "Gravel", description: "Gravel with some drafting" },
  { value: "xc_mtb", label: "XC MTB", description: "Cross-country MTB" },
  { value: "ultra_mtb", label: "Ultra MTB", description: "Ultra MTB with hike-a-bike" },
];
