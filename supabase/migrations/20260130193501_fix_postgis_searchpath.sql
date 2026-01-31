-- Fix PostGIS search path for Supabase hosted.
-- Ensures geography type is accessible in public schema.

-- Ensure extensions schema is in the search path for this session
SET search_path TO public, extensions;

-- Re-create the extension in public schema if needed
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;
