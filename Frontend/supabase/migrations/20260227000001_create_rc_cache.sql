-- Create table to cache RC API responses
CREATE TABLE IF NOT EXISTS rc_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rc_number TEXT UNIQUE NOT NULL,
  api_response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rc_cache_rc_number ON rc_cache(rc_number);

-- Enable RLS
ALTER TABLE rc_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read rc_cache"
  ON rc_cache FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert rc_cache"
  ON rc_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);
