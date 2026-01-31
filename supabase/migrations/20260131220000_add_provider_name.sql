-- Add name column to providers table
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS name text;

-- Update test provider with name
UPDATE public.providers SET name = 'John Smith' WHERE phone = '+6421000001';
