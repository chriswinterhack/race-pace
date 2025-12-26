-- Migration: User custom items for reusable drop bag items
-- Stores custom items that users create for quick reuse across races

CREATE TABLE user_custom_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('nutrition', 'clothing', 'repair', 'electronics', 'medical', 'other')),
  default_quantity INTEGER DEFAULT 1 NOT NULL CHECK (default_quantity > 0),
  use_count INTEGER DEFAULT 0 NOT NULL, -- Track how often this item is used for sorting
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
);

CREATE INDEX idx_user_custom_items_user ON user_custom_items(user_id);
CREATE INDEX idx_user_custom_items_use_count ON user_custom_items(user_id, use_count DESC);

-- Enable Row Level Security
ALTER TABLE user_custom_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own custom items" ON user_custom_items
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own custom items" ON user_custom_items
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own custom items" ON user_custom_items
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own custom items" ON user_custom_items
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Updated at trigger
CREATE TRIGGER set_updated_at_user_custom_items
  BEFORE UPDATE ON user_custom_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
