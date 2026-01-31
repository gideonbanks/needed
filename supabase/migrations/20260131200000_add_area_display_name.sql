-- Add display_name column to provider_areas
-- This stores the human-readable location name selected by the provider

ALTER TABLE public.provider_areas
ADD COLUMN IF NOT EXISTS display_name TEXT;

COMMENT ON COLUMN public.provider_areas.display_name IS 'Human-readable location name (e.g., "Queen Street, Auckland Central")';
