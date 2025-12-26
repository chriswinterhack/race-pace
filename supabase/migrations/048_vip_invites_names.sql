-- Add first_name and last_name to vip_invites
ALTER TABLE vip_invites ADD COLUMN first_name TEXT;
ALTER TABLE vip_invites ADD COLUMN last_name TEXT;
