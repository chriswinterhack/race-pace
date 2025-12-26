-- Waitlist for pre-launch signups
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'homepage', -- where they signed up from
  created_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ, -- when we sent launch notification
  converted_at TIMESTAMPTZ, -- when they created an account
  notes TEXT
);

-- Index for email lookup
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created ON waitlist(created_at DESC);

-- RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Public can insert (sign up for waitlist)
CREATE POLICY "Anyone can join waitlist"
  ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admins can view and manage waitlist
CREATE POLICY "Admins can manage waitlist"
  ON waitlist
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role full access
CREATE POLICY "Service role full access waitlist"
  ON waitlist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
