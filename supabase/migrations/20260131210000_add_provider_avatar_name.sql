-- Add avatar_url and name columns to providers table
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for provider avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to avatars
CREATE POLICY "Public avatar read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated uploads to avatars (service role handles this)
CREATE POLICY "Service role avatar upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Allow service role to delete avatars
CREATE POLICY "Service role avatar delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
