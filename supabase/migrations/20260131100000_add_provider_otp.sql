-- Add OTP columns to providers table for phone-based authentication

ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS otp_code TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;

-- Index for OTP lookup during verification
CREATE INDEX IF NOT EXISTS idx_providers_otp_lookup
ON public.providers(phone, otp_code)
WHERE otp_code IS NOT NULL;
