export type NotificationType =
  | "discussion_post"
  | "discussion_reply"
  | "gear_share"
  | "new_race"
  | "athlete_profile_update";

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  race_id: string | null;
  discussion_id: string | null;
  actor_id: string;
  target_user_id: string | null;
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined data for display
  actor?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  race?: {
    id: string;
    name: string;
    slug: string;
  };
  // Computed at query time
  is_read?: boolean;
}

export interface NotificationPreferences {
  user_id: string;
  discussion_activity: boolean;
  gear_shares: boolean;
  new_races: boolean;
  coach_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  notifications: NotificationEvent[];
  unread_count: number;
  has_more: boolean;
}

export interface CreateNotificationEventParams {
  type: NotificationType;
  actor_id: string;
  race_id?: string;
  discussion_id?: string;
  target_user_id?: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}
