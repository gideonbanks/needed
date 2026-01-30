-- Quick Supabase Setup SQL
-- Copy and paste this into your Supabase SQL Editor
-- Run this FIRST to create the basic tables needed for the test page

-- Enable PostGIS extension only if you need spatial queries (ST_Distance, ST_Within, etc.)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add partial index for active services lookups
CREATE INDEX IF NOT EXISTS idx_services_active_slug ON services(slug) WHERE is_active = true;

-- Insert initial services
INSERT INTO services (slug, name) VALUES
  ('plumber', 'Plumber'),
  ('electrician', 'Electrician'),
  ('locksmith', 'Locksmith'),
  ('movers', 'Movers'),
  ('carpet-cleaning', 'Carpet Cleaning'),
  ('rubbish-removal', 'Rubbish Removal'),
  ('house-cleaning', 'House Cleaners'),
  ('heat-pump-servicing', 'Heat Pump Servicing'),
  ('handyman', 'Handyman'),
  ('lawn-mowing', 'Lawn Mowing')
ON CONFLICT (slug) DO NOTHING;

-- Enable Row Level Security (basic - allow public read for services)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Allow public read access to services
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (true);
