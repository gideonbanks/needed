-- Auto-generated helper: compact NZ road names scoped to LINZ localities
--
-- Goal:
-- - Provide cheap, local-only autocomplete for inputs like "Lowes Road, Rolleston"
-- - Store ONLY road_name + locality_id (FK) (+ denormalized display fields for search)
--
-- Prereqs:
-- - `nz_localities` table exists (seeded from `supabase/seed/nz_localities.sql`)
--
-- Note:
-- - This project no longer relies on a large “roads” seed table.
-- - This script creates the table + indexes only; you should populate
--   `nz_road_names` via your own import (COPY/INSERT) as needed.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS nz_road_names (
  id SERIAL PRIMARY KEY,
  road_name TEXT NOT NULL,
  locality_linz_id INTEGER NOT NULL REFERENCES nz_localities(linz_id) ON DELETE CASCADE,
  locality_name TEXT NOT NULL,
  ta TEXT,
  display_name TEXT GENERATED ALWAYS AS (road_name || ', ' || locality_name) STORED,
  UNIQUE (locality_linz_id, road_name)
);

-- Indexes for fast autocomplete
CREATE INDEX IF NOT EXISTS nz_road_names_road_trgm_idx
  ON nz_road_names USING GIN (road_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS nz_road_names_display_trgm_idx
  ON nz_road_names USING GIN (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS nz_road_names_locality_idx
  ON nz_road_names (locality_linz_id);
