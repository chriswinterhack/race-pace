// User roles
export type UserRole = "athlete" | "coach" | "admin";

// Subscription status
export type SubscriptionStatus = "active" | "inactive" | "past_due" | "canceled";

// Subscription tiers
export type SubscriptionTier = "athlete" | "coach_starter" | "coach_pro" | "coach_unlimited";

// Unit preferences
export type UnitPreference = "metric" | "imperial";

// Effort levels for segments
export type EffortLevel = "safe" | "tempo" | "pushing";

// Plan status
export type PlanStatus = "draft" | "complete";

// Race types for power calculation adjustment
export type RaceType = "road" | "gravel" | "xc_mtb" | "ultra_mtb";

// Packing checklist categories
export type PackingCategory =
  | "on_bike"
  | "drop_bag"
  | "race_morning"
  | "crew"
  | "jersey_pocket";

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  subscription_tier: SubscriptionTier | null;
  coach_id: string | null;
  profile_public: boolean;
  created_at: string;
  updated_at: string;
}

// Intensity factors type
export interface IntensityFactors {
  safe: number;
  tempo: number;
  pushing: number;
}

// Athlete profile type
export interface AthleteProfile {
  id: string;
  user_id: string;
  weight_kg: number | null;
  gear_weight_kg: number | null; // Total equipment weight (bike + hydration + gear)
  ftp_watts: number | null;
  altitude_adjustment_factor: number;
  // Intensity factors for power zones
  if_safe: number;
  if_tempo: number;
  if_pushing: number;
  // Coach lock settings
  power_settings_locked: boolean;
  power_settings_locked_by: string | null;
  // Nutrition defaults
  nutrition_cho_per_hour: number;
  hydration_ml_per_hour: number;
  sodium_mg_per_hour: number;
  preferred_units: UnitPreference;
  created_at: string;
  updated_at: string;
}

// Aid station type
export interface AidStation {
  name: string;
  mile: number;
  supplies: string[];
  cutoff_time: string | null;
  type?: "aid_station" | "checkpoint";
}

// Surface composition for courses
export interface SurfaceComposition {
  gravel_pct: number;
  pavement_pct: number;
  singletrack_pct: number;
  dirt_pct: number;
}

// Wave info for start waves
export interface WaveInfo {
  name: string;
  start_time: string;
  capacity: number | null;
  description: string | null;
}

// Race type (persistent entity - e.g., "Unbound Gravel")
export interface Race {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Race edition type (specific year - e.g., "Unbound 2025")
export interface RaceEdition {
  id: string;
  race_id: string;
  name: string | null; // Optional override like "2025 Mid South"
  year: number;
  date: string | null; // Optional - for single-day events
  registration_opens: string | null;
  registration_closes: string | null;
  gpx_file_url: string | null; // Legacy - now on distances
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Course profile from GPX analysis
export interface CourseProfile {
  climbing_pct: number | null;
  flat_pct: number | null;
  descent_pct: number | null;
  avg_climb_grade: number | null;
  avg_descent_grade: number | null;
}

// Race distance type (specific course - e.g., "Unbound 2025 - 200 mile")
export interface RaceDistance {
  id: string;
  race_edition_id: string;
  name: string | null; // Optional name like "XL", "Black", "Sprint"
  distance_miles: number;
  distance_km: number; // Computed column
  date: string | null;
  start_time: string | null;
  wave_info: WaveInfo[];
  gpx_file_url: string | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  elevation_high: number | null;
  elevation_low: number | null;
  surface_composition: SurfaceComposition;
  // Course profile from GPX analysis
  climbing_pct: number | null;
  flat_pct: number | null;
  descent_pct: number | null;
  avg_climb_grade: number | null;
  avg_descent_grade: number | null;
  total_elevation_loss: number | null;
  race_type: RaceType | null; // Race type for power calculation adjustment
  aid_stations: AidStation[];
  time_limit_minutes: number | null;
  participant_limit: number | null;
  registration_url: string | null;
  registration_fee_cents: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Race with editions (for list views)
export interface RaceWithEditions extends Race {
  race_editions: RaceEdition[];
}

// Race edition with distances (for detail views)
export interface RaceEditionWithDistances extends RaceEdition {
  race_distances: RaceDistance[];
}

// Race edition with parent race (for breadcrumbs)
export interface RaceEditionWithRace extends RaceEdition {
  race: Race;
}

// Full race hierarchy (for complete views)
export interface RaceEditionFull extends RaceEdition {
  race: Race;
  race_distances: RaceDistance[];
}

// Segment type
export interface Segment {
  id: string;
  race_plan_id: string;
  segment_order: number;
  start_mile: number;
  end_mile: number;
  start_name: string;
  end_name: string;
  target_time_minutes: number;
  effort_level: EffortLevel;
  power_target_low: number;
  power_target_high: number;
  nutrition_notes: string | null;
  hydration_notes: string | null;
  terrain_notes: string | null;
  strategy_notes: string | null;
}

// Race plan type
export interface RacePlan {
  id: string;
  user_id: string;
  race_id: string;
  race_edition_id: string | null;
  race_distance_id: string | null;
  goal_time_minutes: number;
  goal_np_watts: number | null; // Manual override for Goal NP (coach-provided or user-set)
  created_by: string;
  segments: Segment[];
  status: PlanStatus;
  created_at: string;
  updated_at: string;
}

// Gear setup type
export interface GearSetup {
  id: string;
  user_id: string;
  race_id: string;
  race_edition_id: string | null;
  bike_brand: string;
  bike_model: string;
  bike_year: number | null;
  tire_brand: string;
  tire_model: string;
  tire_width: number;
  repair_kit_contents: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Packing item type
export interface PackingItem {
  name: string;
  category: PackingCategory;
  location: string;
  quantity: number;
  packed: boolean;
}

// Packing checklist type
export interface PackingChecklist {
  id: string;
  user_id: string;
  race_id: string;
  race_edition_id: string | null;
  items: PackingItem[];
  created_at: string;
  updated_at: string;
}

// Forum post type
export interface ForumPost {
  id: string;
  race_id: string;
  race_edition_id: string | null;
  user_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

// Forum reply type
export interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

// API response format
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Form input types for creating/updating
export interface CreateRaceInput {
  name: string;
  slug: string;
  location?: string;
  description?: string;
  website_url?: string;
}

export interface CreateRaceEditionInput {
  race_id: string;
  year: number;
  date?: string;
  registration_opens?: string;
  registration_closes?: string;
}

export interface CreateRaceDistanceInput {
  race_edition_id: string;
  name?: string;
  distance_miles: number;
  date?: string;
  start_time?: string;
  gpx_file_url?: string;
  elevation_gain?: number;
  time_limit_minutes?: number;
  participant_limit?: number;
}
