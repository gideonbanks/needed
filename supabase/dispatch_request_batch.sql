-- Needed.co.nz — Dispatch batch (matching + request_dispatches)
--
-- This function is designed to be called from `/api/request/send` (batch 1)
-- and later from a `/api/request/resend` endpoint (batch 2+).
--
-- Prereqs (see `SUPABASE_SETUP.md`):
-- - PostGIS enabled
-- - Tables: requests, providers, provider_services, provider_areas, provider_availability, request_dispatches
-- - `provider_areas.center_point` and `requests.location_point` triggers in place
--
-- Notes:
-- - Idempotency: `request_dispatches` has UNIQUE(request_id, provider_id); inserts use ON CONFLICT DO NOTHING
-- - Safety: Uses an explicit customer_id check to prevent dispatching someone else's request.
-- - Policy: For `time_need = 'now'`, requires provider_availability.is_available = true.
--
CREATE OR REPLACE FUNCTION dispatch_request_batch(
  p_request_id uuid,
  p_customer_id uuid,
  p_batch_number int DEFAULT 1,
  p_limit int DEFAULT 3
)
RETURNS TABLE (
  matched_provider_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_id uuid;
  v_time_need text;
  v_status text;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'p_limit must be >= 1';
  END IF;

  -- Lock the request row to prevent concurrent sends/resends
  SELECT r.service_id, r.time_need, r.status
    INTO v_service_id, v_time_need, v_status
  FROM requests r
  WHERE r.id = p_request_id
    AND r.customer_id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found for customer';
  END IF;

  -- Batch 1 transitions draft -> sent; later batches must not be called on draft
  IF p_batch_number = 1 THEN
    IF v_status <> 'draft' THEN
      RAISE EXCEPTION 'Request already sent or status changed';
    END IF;

    UPDATE requests
    SET status = 'sent',
        sent_at = NOW()
    WHERE id = p_request_id
      AND status = 'draft';
  ELSE
    IF v_status = 'draft' THEN
      RAISE EXCEPTION 'Cannot dispatch batch % for draft request', p_batch_number;
    END IF;
  END IF;

  -- Insert dispatch rows for up to p_limit eligible providers.
  RETURN QUERY
  WITH eligible AS (
    SELECT
      pa.provider_id,
      MIN(
        ST_Distance(
          ST_SetSRID(ST_MakePoint(r.lng, r.lat), 4326)::geography,
          pa.center_point
        ) / 1000.0
      ) AS distance_km
    FROM requests r
    JOIN provider_areas pa
      ON ST_DWithin(
        ST_SetSRID(ST_MakePoint(r.lng, r.lat), 4326)::geography,
        pa.center_point,
        pa.radius_km * 1000
      )
    JOIN provider_services ps
      ON ps.provider_id = pa.provider_id
     AND ps.service_id = v_service_id
    JOIN providers p
      ON p.id = pa.provider_id
     AND p.status = 'approved'
    LEFT JOIN provider_availability pav
      ON pav.provider_id = pa.provider_id
    WHERE r.id = p_request_id
      -- For "now", only notify providers who are currently available.
      -- Providers without an availability record are treated as unavailable.
      AND (v_time_need <> 'now' OR pav.is_available = true)
      -- Hard rule: never send the same request to the same provider twice (any batch).
      AND NOT EXISTS (
        SELECT 1
        FROM request_dispatches d
        WHERE d.request_id = p_request_id
          AND d.provider_id = pa.provider_id
      )
    GROUP BY pa.provider_id
  ),
  chosen AS (
    SELECT e.provider_id
    FROM eligible e
    ORDER BY e.distance_km ASC, random()
    LIMIT p_limit
  ),
  inserted AS (
    INSERT INTO request_dispatches (request_id, provider_id, batch_number)
    SELECT p_request_id, c.provider_id, p_batch_number
    FROM chosen c
    ON CONFLICT (request_id, provider_id) DO NOTHING
    RETURNING provider_id
  )
  SELECT inserted.provider_id AS matched_provider_id FROM inserted;
END;
$$;
