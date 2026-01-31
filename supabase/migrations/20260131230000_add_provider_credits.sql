-- Add credits column to providers table
-- Credits represent the provider's balance for contacting customers
-- $1.00 = 1 credit (inc GST)

ALTER TABLE providers
ADD COLUMN credits integer NOT NULL DEFAULT 0;

-- Add a check constraint to ensure credits are never negative
ALTER TABLE providers
ADD CONSTRAINT providers_credits_non_negative CHECK (credits >= 0);

-- Create an index for querying providers by credits (useful for low balance notifications)
CREATE INDEX idx_providers_credits ON providers(credits);
