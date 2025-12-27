// Types for settings page

export interface AthleteProfile {
  id: string;
  user_id: string;
  weight_kg: number | null;
  gear_weight_kg: number | null;
  ftp_watts: number | null;
  altitude_adjustment_factor: number | null;
  if_safe: number | null;
  if_tempo: number | null;
  if_pushing: number | null;
  power_settings_locked: boolean;
  power_settings_locked_by: string | null;
  nutrition_cho_per_hour: number | null;
  hydration_ml_per_hour: number | null;
  sodium_mg_per_hour: number | null;
  preferred_units: "metric" | "imperial";
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  profile_public: boolean;
  avatar_url: string | null;
}

export type SettingsSection =
  | "profile"
  | "athlete"
  | "nutrition"
  | "preferences"
  | "billing"
  | "notifications"
  | "integrations"
  | "account";

export interface SubscriptionData {
  isPremium: boolean;
  status: "active" | "inactive" | "past_due" | "canceled";
  isLifetime: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface SettingsFormState {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  city: string;
  state: string;
  ftp: string;
  weight: string;
  gearWeight: string;
  altitudeAdjustment: string;
  ifSafe: string;
  ifTempo: string;
  ifPushing: string;
  carbsPerHour: string;
  fluidPerHour: string;
  sodiumPerHour: string;
  preferredUnits: "metric" | "imperial";
  publicProfile: boolean;
}
