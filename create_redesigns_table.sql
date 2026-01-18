-- Create Redesigns / Creations Table for standardizing history
-- This stores both "Design Mode" (Images) and "Clone Mode" (HTML) results

CREATE TABLE IF NOT EXISTS redesigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk User ID
  prompt TEXT NOT NULL,
  type TEXT DEFAULT 'html', -- 'html' or 'image'
  content TEXT, -- HTML content or Image URL (if cloud stored)
  image_data TEXT, -- Base64 if needed, or null
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE redesigns ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own redesigns" ON redesigns;
CREATE POLICY "Users can view own redesigns" ON redesigns
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own redesigns" ON redesigns;
CREATE POLICY "Users can insert own redesigns" ON redesigns
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own redesigns" ON redesigns;
CREATE POLICY "Users can delete own redesigns" ON redesigns
  FOR DELETE USING (auth.uid()::text = user_id);
