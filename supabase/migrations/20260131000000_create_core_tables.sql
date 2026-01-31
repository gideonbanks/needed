-- =============================================================================
-- Needed MVP Core Tables Migration
-- Creates: customers, requests, providers, provider_services, provider_areas,
--          provider_availability, request_dispatches
-- =============================================================================
-- Safe/idempotent: Uses IF NOT EXISTS and ON CONFLICT DO NOTHING patterns.

-- Ensure PostGIS types are accessible (Supabase hosts extensions in 'extensions' schema)
SET search_path TO public, extensions;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- CUSTOMERS (phone-based identification)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers accessible via service" ON public.customers;
CREATE POLICY "Customers accessible via service"
  ON public.customers FOR ALL
  USING (true);


-- =============================================================================
-- PROVIDERS (service provider accounts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  business_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index for approved providers (used heavily in dispatch)
CREATE INDEX IF NOT EXISTS idx_providers_approved
  ON public.providers(id)
  WHERE status = 'approved';

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers accessible via service" ON public.providers;
CREATE POLICY "Providers accessible via service"
  ON public.providers FOR ALL
  USING (true);


-- =============================================================================
-- REQUESTS (customer service requests)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  time_need TEXT NOT NULL CHECK (time_need IN ('now', 'today', 'this-week')),
  suburb_text TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  details TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'contacted', 'completed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_customer_id ON public.requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Requests accessible via service" ON public.requests;
CREATE POLICY "Requests accessible via service"
  ON public.requests FOR ALL
  USING (true);


-- =============================================================================
-- PROVIDER_SERVICES (which services each provider offers)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_services_service_id ON public.provider_services(service_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_provider_id ON public.provider_services(provider_id);

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Provider services accessible via service" ON public.provider_services;
CREATE POLICY "Provider services accessible via service"
  ON public.provider_services FOR ALL
  USING (true);


-- =============================================================================
-- PROVIDER_AREAS (PostGIS: where a provider operates)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.provider_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL DEFAULT 10.0 CHECK (radius_km > 0 AND radius_km <= 100),
  center_point GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for ST_DWithin queries (critical for performance)
CREATE INDEX IF NOT EXISTS idx_provider_areas_center_point
  ON public.provider_areas USING GIST (center_point);

CREATE INDEX IF NOT EXISTS idx_provider_areas_provider_id ON public.provider_areas(provider_id);

-- Trigger to auto-populate center_point from lat/lng
CREATE OR REPLACE FUNCTION public.set_provider_area_center_point()
RETURNS TRIGGER AS $$
BEGIN
  NEW.center_point := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_provider_area_center_point ON public.provider_areas;
CREATE TRIGGER trg_set_provider_area_center_point
  BEFORE INSERT OR UPDATE OF lat, lng ON public.provider_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_provider_area_center_point();

ALTER TABLE public.provider_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Provider areas accessible via service" ON public.provider_areas;
CREATE POLICY "Provider areas accessible via service"
  ON public.provider_areas FOR ALL
  USING (true);


-- =============================================================================
-- PROVIDER_AVAILABILITY (on/off toggle per provider)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID UNIQUE NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update updated_at on change
CREATE OR REPLACE FUNCTION public.set_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_availability_updated_at ON public.provider_availability;
CREATE TRIGGER trg_set_availability_updated_at
  BEFORE UPDATE ON public.provider_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.set_availability_updated_at();

ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Provider availability accessible via service" ON public.provider_availability;
CREATE POLICY "Provider availability accessible via service"
  ON public.provider_availability FOR ALL
  USING (true);


-- =============================================================================
-- REQUEST_DISPATCHES (tracking which providers received which requests)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.request_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  batch_number INT NOT NULL DEFAULT 1 CHECK (batch_number >= 1),
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_request_dispatches_request_id ON public.request_dispatches(request_id);
CREATE INDEX IF NOT EXISTS idx_request_dispatches_provider_id ON public.request_dispatches(provider_id);

ALTER TABLE public.request_dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Request dispatches accessible via service" ON public.request_dispatches;
CREATE POLICY "Request dispatches accessible via service"
  ON public.request_dispatches FOR ALL
  USING (true);
