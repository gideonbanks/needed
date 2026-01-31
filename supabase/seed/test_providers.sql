-- =============================================================================
-- Test Providers Seed Data
-- Creates 3 test providers in Auckland area for end-to-end testing
-- =============================================================================
-- Run with: psql $DATABASE_URL -f supabase/seed/test_providers.sql
-- Or via Supabase SQL editor

-- Insert test providers (approved status)
INSERT INTO public.providers (id, phone, name, business_name, status) VALUES
  ('11111111-1111-1111-1111-111111111111', '+6421000001', 'John Smith', 'Test Plumber Auckland', 'approved'),
  ('22222222-2222-2222-2222-222222222222', '+6421000002', 'Jane Doe', 'Test Plumber Ponsonby', 'approved'),
  ('33333333-3333-3333-3333-333333333333', '+6421000003', 'Bob Wilson', 'Test Electrician Newmarket', 'approved')
ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  business_name = EXCLUDED.business_name,
  status = EXCLUDED.status;

-- Link providers to services
-- Test Plumber Auckland: plumber, handyman
INSERT INTO public.provider_services (provider_id, service_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM public.services WHERE slug IN ('plumber', 'handyman')
ON CONFLICT (provider_id, service_id) DO NOTHING;

-- Test Plumber Ponsonby: plumber
INSERT INTO public.provider_services (provider_id, service_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM public.services WHERE slug = 'plumber'
ON CONFLICT (provider_id, service_id) DO NOTHING;

-- Test Electrician Newmarket: electrician, handyman
INSERT INTO public.provider_services (provider_id, service_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM public.services WHERE slug IN ('electrician', 'handyman')
ON CONFLICT (provider_id, service_id) DO NOTHING;

-- Set provider coverage areas (Auckland area coordinates)
-- Auckland CBD: -36.848, 174.763
-- Ponsonby: -36.856, 174.745
-- Newmarket: -36.870, 174.778
INSERT INTO public.provider_areas (provider_id, lat, lng, radius_km) VALUES
  ('11111111-1111-1111-1111-111111111111', -36.848, 174.763, 15.0),
  ('22222222-2222-2222-2222-222222222222', -36.856, 174.745, 10.0),
  ('33333333-3333-3333-3333-333333333333', -36.870, 174.778, 12.0)
ON CONFLICT DO NOTHING;

-- Set availability (2 available, 1 unavailable for testing)
INSERT INTO public.provider_availability (provider_id, is_available) VALUES
  ('11111111-1111-1111-1111-111111111111', true),
  ('22222222-2222-2222-2222-222222222222', false),
  ('33333333-3333-3333-3333-333333333333', true)
ON CONFLICT (provider_id) DO UPDATE SET is_available = EXCLUDED.is_available;
