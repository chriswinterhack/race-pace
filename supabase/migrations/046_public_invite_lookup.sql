-- Allow public lookup of invites by code (for signup page validation)
-- This allows unauthenticated users to check if an invite code is valid

CREATE POLICY "Anyone can lookup pending invites by code"
  ON vip_invites
  FOR SELECT
  TO anon
  USING (status = 'pending');
