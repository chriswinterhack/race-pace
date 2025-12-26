-- VIP Invites & Comped Subscriptions
-- For inviting friends, pros, influencers with optional free premium

-- Track VIP invites sent by admins
CREATE TABLE vip_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id),

  -- Premium grant settings
  grant_premium BOOLEAN DEFAULT false,
  premium_duration_days INTEGER DEFAULT 365,

  -- Status tracking
  status TEXT DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT vip_invites_valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
);

-- Track comped (free) premium memberships
CREATE TABLE comped_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  granted_by UUID REFERENCES auth.users(id),

  -- Duration
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Source tracking
  source TEXT NOT NULL,
  source_id UUID,

  -- Status
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT comped_subscriptions_valid_source CHECK (source IN ('vip_invite', 'admin_grant', 'promo', 'beta_tester', 'partner'))
);

-- Indexes for performance
CREATE INDEX idx_vip_invites_email ON vip_invites(email);
CREATE INDEX idx_vip_invites_code ON vip_invites(invite_code) WHERE status = 'pending';
CREATE INDEX idx_vip_invites_status ON vip_invites(status);
CREATE INDEX idx_comped_subscriptions_user ON comped_subscriptions(user_id) WHERE is_active = true;
CREATE INDEX idx_comped_subscriptions_expires ON comped_subscriptions(expires_at) WHERE is_active = true;

-- RLS Policies
ALTER TABLE vip_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comped_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all invites
CREATE POLICY "Admins can manage vip_invites"
  ON vip_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can manage all comped subscriptions
CREATE POLICY "Admins can manage comped_subscriptions"
  ON comped_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Users can view their own comped subscription
CREATE POLICY "Users can view own comped_subscription"
  ON comped_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can access everything (for API routes)
CREATE POLICY "Service role full access vip_invites"
  ON vip_invites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access comped_subscriptions"
  ON comped_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Helper function to check if user has active comped subscription
CREATE OR REPLACE FUNCTION has_active_comped_subscription(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM comped_subscriptions
    WHERE user_id = check_user_id
      AND is_active = true
      AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the is_premium function to include comped subscriptions
-- Must drop first because we're changing the function body
DROP FUNCTION IF EXISTS is_premium(UUID);

CREATE OR REPLACE FUNCTION is_premium(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Check Stripe subscription first
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE id = check_user_id
      AND subscription_status = 'active'
  ) THEN
    RETURN true;
  END IF;

  -- Check comped subscription
  IF has_active_comped_subscription(check_user_id) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_premium IS 'Checks if user has active Stripe or comped subscription';
