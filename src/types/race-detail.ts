// Types for race detail page

export interface AidStation {
  name: string;
  mile: number;
  supplies?: string[];
  cutoff_time?: string;
  type?: "aid_station" | "checkpoint";
}

export interface SurfaceComposition {
  gravel?: number;
  pavement?: number;
  singletrack?: number;
  doubletrack?: number;
  dirt?: number;
}

export interface RaceDistance {
  id: string;
  name: string | null;
  distance_miles: number;
  date: string | null;
  start_time: string | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  surface_composition: SurfaceComposition | null;
  aid_stations: AidStation[] | null;
  registration_fee_cents: number | null;
  time_limit_minutes: number | null;
}

export interface RaceEdition {
  id: string;
  year: number;
  registration_opens: string | null;
  registration_closes: string | null;
  race_distances: RaceDistance[];
}

export interface Race {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  website_url: string | null;
  hero_image_url: string | null;
  race_type: "bike" | "run";
  race_subtype: string;
  parking_info: string | null;
  weather_notes: string | null;
  course_rules: string | null;
  course_marking: string | null;
  crew_info: string | null;
  drop_bag_info: string | null;
  race_editions: RaceEdition[];
}

export interface GearAggregation {
  brand: string;
  model: string;
  width?: string;
  count: number;
  percentage: number;
}

export interface RaceGearStats {
  total_participants: number;
  bikes: GearAggregation[];
  front_tires: GearAggregation[];
  rear_tires: GearAggregation[];
}

export type TabId = "overview" | "course" | "community" | "discussions";
