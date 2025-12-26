-- Garmin sync codes for Connect IQ app
-- Allows users to sync their race plans to Garmin devices

CREATE TABLE garmin_sync_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_plan_id UUID NOT NULL REFERENCES race_plans(id) ON DELETE CASCADE,
  code VARCHAR(16) NOT NULL UNIQUE,

  -- Snapshot of race plan data at time of export (so it doesn't change)
  plan_data JSONB NOT NULL,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_synced_at TIMESTAMPTZ,
  sync_count INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true
);

-- Index for code lookups (primary use case)
CREATE INDEX idx_garmin_sync_codes_code ON garmin_sync_codes(code) WHERE is_active = true;

-- Index for user's codes
CREATE INDEX idx_garmin_sync_codes_user ON garmin_sync_codes(user_id);

-- Function to generate a unique sync code
CREATE OR REPLACE FUNCTION generate_garmin_sync_code()
RETURNS VARCHAR(16) AS $$
DECLARE
  chars VARCHAR(32) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No I, O, 0, 1 for clarity
  result VARCHAR(16) := 'FC-';
  i INTEGER;
BEGIN
  -- Generate format: FC-XXXX-XXXX
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE garmin_sync_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own sync codes
CREATE POLICY "Users can view own sync codes"
  ON garmin_sync_codes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create sync codes for their own plans
CREATE POLICY "Users can create sync codes for own plans"
  ON garmin_sync_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM race_plans
      WHERE id = race_plan_id AND user_id = auth.uid()
    )
  );

-- Users can update their own sync codes (e.g., deactivate)
CREATE POLICY "Users can update own sync codes"
  ON garmin_sync_codes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can update sync_count and last_synced_at (for API validation endpoint)
-- This is handled by using service role key in the API
