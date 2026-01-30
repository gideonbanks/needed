-- Drop legacy demo `locations` table (not used by app codepaths).
-- Safe/idempotent: table may not exist on some environments.

DROP TABLE IF EXISTS public.locations CASCADE;

