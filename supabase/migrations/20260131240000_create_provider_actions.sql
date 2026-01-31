-- Provider actions table for tracking contact attempts (billing trigger)
-- Per NEEDED.md Section 8: Provider is charged when they tap Call/Text

CREATE TABLE provider_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  dispatch_id UUID REFERENCES request_dispatches(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('call', 'text', 'email')),
  credit_cost INTEGER NOT NULL DEFAULT 0,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Billing status
  charge_status TEXT NOT NULL DEFAULT 'charged' CHECK (charge_status IN ('pending', 'charged', 'failed', 'refunded')),
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_provider_actions_request ON provider_actions(request_id);
CREATE INDEX idx_provider_actions_provider ON provider_actions(provider_id);
CREATE INDEX idx_provider_actions_occurred ON provider_actions(occurred_at DESC);

-- Prevent duplicate contact for same request by same provider
-- (provider can only charge once per request, though they can call/text multiple times)
CREATE UNIQUE INDEX idx_provider_actions_unique_charge
  ON provider_actions(request_id, provider_id)
  WHERE charge_status = 'charged';

-- Update request status to 'contacted' when first action occurs
CREATE OR REPLACE FUNCTION update_request_on_contact()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE requests
  SET status = 'contacted'
  WHERE id = NEW.request_id
    AND status = 'sent';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_request_on_contact
  AFTER INSERT ON provider_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_request_on_contact();

-- Update dispatch status when provider contacts
CREATE OR REPLACE FUNCTION update_dispatch_on_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dispatch_id IS NOT NULL THEN
    UPDATE request_dispatches
    SET status = 'contacted'
    WHERE id = NEW.dispatch_id
      AND status IN ('sent', 'viewed');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add status column to request_dispatches if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'request_dispatches' AND column_name = 'status'
  ) THEN
    ALTER TABLE request_dispatches
    ADD COLUMN status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'viewed', 'contacted', 'passed', 'expired'));
  END IF;
END $$;

CREATE TRIGGER trigger_update_dispatch_on_contact
  AFTER INSERT ON provider_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_dispatch_on_contact();
