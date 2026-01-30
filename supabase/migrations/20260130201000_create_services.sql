-- Create + seed `services` reference table.
-- Safe/idempotent.
--
-- This fixes local dev where PostgREST returns PGRST205 if the table doesn't exist.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_active_slug
  ON public.services(slug)
  WHERE is_active = true;

INSERT INTO public.services (slug, name) VALUES
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

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
CREATE POLICY "Services are viewable by everyone"
  ON public.services FOR SELECT
  USING (true);

