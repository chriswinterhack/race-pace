-- Add foreign key relationships from race_discussions to public users table
-- This enables Supabase to resolve the user join in queries

-- Add FK from race_discussions to public.users
ALTER TABLE race_discussions
ADD CONSTRAINT race_discussions_user_id_fkey_public
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add FK from race_discussion_replies to public.users
ALTER TABLE race_discussion_replies
ADD CONSTRAINT race_discussion_replies_user_id_fkey_public
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
