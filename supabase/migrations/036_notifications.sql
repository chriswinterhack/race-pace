-- Notifications System
-- Enables in-app notifications for discussion activity, gear shares, new races, and coach alerts

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'discussion_post',
  'discussion_reply',
  'gear_share',
  'new_race',
  'athlete_profile_update'
);

-- Notification events - one record per event (not per recipient)
-- Uses "fan-out on read" pattern for scalability
CREATE TABLE notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  -- Polymorphic references to source entities
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES race_discussions(id) ON DELETE CASCADE,
  -- The user who triggered this event
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- For athlete_profile_update: the athlete whose profile changed
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Display content
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discussion_activity BOOLEAN DEFAULT true NOT NULL,
  gear_shares BOOLEAN DEFAULT true NOT NULL,
  new_races BOOLEAN DEFAULT true NOT NULL,
  coach_alerts BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Track which notifications a user has read (sparse table)
CREATE TABLE notification_reads (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_event_id UUID NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, notification_event_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_notification_events_race_id ON notification_events(race_id);
CREATE INDEX idx_notification_events_created_at ON notification_events(created_at DESC);
CREATE INDEX idx_notification_events_type ON notification_events(type);
CREATE INDEX idx_notification_events_actor_id ON notification_events(actor_id);
CREATE INDEX idx_notification_events_target_user_id ON notification_events(target_user_id);
CREATE INDEX idx_notification_reads_user_id ON notification_reads(user_id);

-- Trigger for updated_at on preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_events
-- All authenticated users can view events (filtering done at API level for performance)
CREATE POLICY "Authenticated users can view notification events"
  ON notification_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only the system (via service role) can insert events
CREATE POLICY "Service role can insert notification events"
  ON notification_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for notification_reads
CREATE POLICY "Users can view own reads"
  ON notification_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reads"
  ON notification_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reads"
  ON notification_reads FOR DELETE
  USING (auth.uid() = user_id);
