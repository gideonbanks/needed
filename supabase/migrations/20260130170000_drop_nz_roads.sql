-- Drop legacy NZ roads seed table (runtime should use `nz_road_names`).
-- Safe/idempotent.

DROP TABLE IF EXISTS public.nz_roads CASCADE;

