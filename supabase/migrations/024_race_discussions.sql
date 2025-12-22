-- Race Community Discussions
-- Allows registered participants to discuss logistics, gear, travel, training, etc.

-- Discussion categories enum
CREATE TYPE discussion_category AS ENUM (
  'general',
  'gear',
  'logistics',
  'training',
  'strategy'
);

-- Main discussion posts
CREATE TABLE race_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category discussion_category NOT NULL DEFAULT 'general',
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  body TEXT NOT NULL CHECK (char_length(body) >= 10 AND char_length(body) <= 10000),
  is_pinned BOOLEAN DEFAULT FALSE,
  reply_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Replies to discussion posts
CREATE TABLE race_discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES race_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 5000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_race_discussions_race_id ON race_discussions(race_id);
CREATE INDEX idx_race_discussions_race_category ON race_discussions(race_id, category);
CREATE INDEX idx_race_discussions_last_activity ON race_discussions(race_id, last_activity_at DESC);
CREATE INDEX idx_race_discussion_replies_discussion_id ON race_discussion_replies(discussion_id);
CREATE INDEX idx_race_discussion_replies_created_at ON race_discussion_replies(discussion_id, created_at);

-- Function to update reply count and last activity
CREATE OR REPLACE FUNCTION update_discussion_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE race_discussions
    SET
      reply_count = reply_count + 1,
      last_activity_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.discussion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE race_discussions
    SET
      reply_count = GREATEST(0, reply_count - 1),
      updated_at = NOW()
    WHERE id = OLD.discussion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats on reply changes
CREATE TRIGGER trigger_update_discussion_stats
AFTER INSERT OR DELETE ON race_discussion_replies
FOR EACH ROW EXECUTE FUNCTION update_discussion_stats();

-- Function to check if user is registered for a race
CREATE OR REPLACE FUNCTION is_registered_for_race(check_user_id UUID, check_race_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM race_plans rp
    JOIN race_distances rd ON rp.race_distance_id = rd.id
    JOIN race_editions re ON rd.race_edition_id = re.id
    WHERE rp.user_id = check_user_id AND re.race_id = check_race_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for race_discussions

ALTER TABLE race_discussions ENABLE ROW LEVEL SECURITY;

-- Users can view discussions for races they're registered for
CREATE POLICY "Users can view discussions for their races"
ON race_discussions FOR SELECT
USING (is_registered_for_race(auth.uid(), race_id));

-- Users can create discussions for races they're registered for
CREATE POLICY "Users can create discussions for their races"
ON race_discussions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  is_registered_for_race(auth.uid(), race_id)
);

-- Users can update their own discussions
CREATE POLICY "Users can update their own discussions"
ON race_discussions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own discussions
CREATE POLICY "Users can delete their own discussions"
ON race_discussions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for race_discussion_replies

ALTER TABLE race_discussion_replies ENABLE ROW LEVEL SECURITY;

-- Users can view replies for discussions they can access
CREATE POLICY "Users can view replies for accessible discussions"
ON race_discussion_replies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM race_discussions d
    WHERE d.id = discussion_id AND is_registered_for_race(auth.uid(), d.race_id)
  )
);

-- Users can create replies for discussions they can access
CREATE POLICY "Users can create replies for accessible discussions"
ON race_discussion_replies FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM race_discussions d
    WHERE d.id = discussion_id AND is_registered_for_race(auth.uid(), d.race_id)
  )
);

-- Users can update their own replies
CREATE POLICY "Users can update their own replies"
ON race_discussion_replies FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own replies
CREATE POLICY "Users can delete their own replies"
ON race_discussion_replies FOR DELETE
USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE race_discussions IS 'Community discussion posts for race participants';
COMMENT ON TABLE race_discussion_replies IS 'Replies to race discussion posts';
COMMENT ON COLUMN race_discussions.category IS 'Topic category: general, gear, logistics, training, strategy';
COMMENT ON COLUMN race_discussions.is_pinned IS 'Admin can pin important discussions to top';
COMMENT ON COLUMN race_discussions.reply_count IS 'Cached count of replies for display';
COMMENT ON COLUMN race_discussions.last_activity_at IS 'Updated when new reply is added';
