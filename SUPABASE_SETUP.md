# Supabase Setup Guide

Complete step-by-step instructions for setting up Supabase for Needed.co.nz

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: `needed` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to New Zealand (e.g., `Southeast Asia (Singapore)`)
   - **Pricing Plan**: Free tier is fine for MVP
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

---

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - ⚠️ Keep this secret!

---

## Step 3: Set Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your keys:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Analytics (optional)
   ANALYZE=false
   ```

3. **Important**: `.env.local` is in `.gitignore` - never commit your keys!

---

## Step 4: Enable PostGIS Extension

PostGIS is **required** for radius-based provider matching (“find providers within radius”).

1. In Supabase dashboard, go to **Database** → **Extensions**
2. Search for `postgis`
3. Click **Enable** on `postgis`
4. Wait for it to activate

---

## Step 5: Create Database Schema

Run these SQL commands in Supabase SQL Editor (**SQL Editor** → **New query**):

### 5.1 Reference Tables

```sql
-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial services
INSERT INTO services (slug, name) VALUES
  ('plumber', 'Plumber'),
  ('electrician', 'Electrician'),
  ('locksmith', 'Locksmith'),
  ('movers', 'Movers'),
  ('carpet-cleaning', 'Carpet Cleaning'),
  ('rubbish-removal', 'Rubbish Removal'),
  ('house-cleaning', 'House cleaners'),
  ('heat-pump-servicing', 'Heat Pump Servicing'),
  ('handyman', 'Handyman'),
  ('lawn-mowing', 'Lawn Mowing');
```

### 5.1.1 Optional: Seed NZ localities (suburbs/towns)

This dataset powers suburb lookups and should cover all NZ localities.

1. Generate the seed files locally:
   ```bash
   node scripts/build-nz-localities.mjs
   ```
   This creates:
   - `public/data/nz-localities.min.json` (client lookup)
   - `supabase/seed/nz_localities.sql` (Supabase seed)

2. Run `supabase/seed/nz_localities.sql` in Supabase SQL Editor.

### 5.1.2 Optional: Seed NZ road names (streets only)

If you want cheap, local-only autocomplete for inputs like "Lowes Road, Rolleston"
without needing exact house addresses or paid geocoding APIs:

1. Seed localities first (see Step 5.1.1).
2. Run `supabase/seed/nz_road_names.sql` to create the `nz_road_names` table + indexes.
3. Build + import the NZ-wide street-name dataset (local dev):
   ```bash
   pnpm seed:nz-road-names
   ```
   This generates `supabase/seed/nz_road_names.csv`, truncates `nz_road_names`, and imports the CSV into your local Supabase Postgres.
   - This project intentionally does **not** rely on a large “roads” seed table anymore.

### 5.2 Users Tables

```sql
-- Customers table (mostly anonymous)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Providers table
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, suspended
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Provider Capabilities

```sql
-- Provider services (many-to-many)
CREATE TABLE provider_services (
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, service_id)
);

-- Provider service areas (with PostGIS)
CREATE TABLE provider_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create PostGIS geometry column for faster queries
ALTER TABLE provider_areas 
ADD COLUMN center_point GEOGRAPHY(POINT, 4326);

-- Create index for spatial queries
CREATE INDEX idx_provider_areas_center ON provider_areas USING GIST (center_point);

-- Provider availability
CREATE TABLE provider_availability (
  provider_id UUID PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.4 Requests Tables

```sql
-- Requests table
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  time_need TEXT NOT NULL, -- 'now', 'today', 'this-week'
  suburb_text TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  details TEXT NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'draft', -- draft, sent, contacted, cancelled, sorted, expired
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create PostGIS point for requests
ALTER TABLE requests 
ADD COLUMN location_point GEOGRAPHY(POINT, 4326);

CREATE INDEX idx_requests_location ON requests USING GIST (location_point);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_sent_at ON requests(sent_at);

-- Request dispatches
CREATE TABLE request_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL DEFAULT 1,
  dispatched_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  state TEXT DEFAULT 'sent', -- sent, viewed, contacted, passed, expired
  UNIQUE(request_id, provider_id) -- Prevent duplicate dispatches
);

CREATE INDEX idx_request_dispatches_request ON request_dispatches(request_id);
CREATE INDEX idx_request_dispatches_provider ON request_dispatches(provider_id);
CREATE INDEX idx_request_dispatches_state ON request_dispatches(state);

-- Provider actions (billing trigger)
CREATE TABLE provider_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'call', 'text', 'email'
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  charge_status TEXT DEFAULT 'pending' -- pending, charged, failed, refunded
);

CREATE INDEX idx_provider_actions_request ON provider_actions(request_id);
CREATE INDEX idx_provider_actions_provider ON provider_actions(provider_id);
```

### 5.5 Metrics & Billing

```sql
-- Provider metrics (daily aggregates)
CREATE TABLE provider_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sent_count INTEGER DEFAULT 0,
  viewed_count INTEGER DEFAULT 0,
  contacted_count INTEGER DEFAULT 0,
  avg_response_seconds INTEGER,
  pass_count INTEGER DEFAULT 0,
  refund_count INTEGER DEFAULT 0,
  UNIQUE(provider_id, date)
);

-- Transactions (billing)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'charge', 'credit'
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NZD',
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  provider_action_id UUID REFERENCES provider_actions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_provider ON transactions(provider_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
```

### 5.6 Helper Functions

```sql
-- Function to update location_point when lat/lng changes
CREATE OR REPLACE FUNCTION update_request_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location_point = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_request_location
  BEFORE INSERT OR UPDATE OF lat, lng ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_request_location();

-- Function to update provider area center point
CREATE OR REPLACE FUNCTION update_provider_area_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.center_point = ST_SetSRID(ST_MakePoint(NEW.center_lng, NEW.center_lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_provider_area_location
  BEFORE INSERT OR UPDATE OF center_lat, center_lng ON provider_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_area_location();

-- Function to find providers within radius (PostGIS)
CREATE OR REPLACE FUNCTION find_providers_within_radius(
  request_lat DOUBLE PRECISION,
  request_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION
)
RETURNS TABLE (
  provider_id UUID,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.provider_id,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(request_lng, request_lat), 4326)::geography,
      pa.center_point
    ) / 1000.0 AS distance_km
  FROM provider_areas pa
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(request_lng, request_lat), 4326)::geography,
    pa.center_point,
    radius_km * 1000
  )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;
```

### 5.7 Dispatch helper (matching + `request_dispatches`)

The API route `app/api/request/send/route.ts` expects a Postgres function named
`dispatch_request_batch(...)` for atomic “send + match + insert dispatch rows”.

You can create it by running the SQL in `supabase/dispatch_request_batch.sql`.

---

## Step 6: Set Up Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_actions ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth requirements)
-- For MVP, you might allow public read on services (and optionally lookup tables)
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (true);

-- Providers can view their own data
CREATE POLICY "Providers can view own data"
  ON providers FOR SELECT
  USING (auth.uid() = id);

-- Customers can view their own requests
CREATE POLICY "Customers can view own requests"
  ON requests FOR SELECT
  USING (auth.uid() = customer_id OR customer_id IS NULL);
```

---

## Step 7: Set Up Storage Bucket

For job photos:

1. Go to **Storage** in Supabase dashboard
2. Click **"New bucket"**
3. Name: `job-photos`
4. Make it **Public** (or private with signed URLs)
5. Click **"Create bucket"**

---

## Step 8: Generate TypeScript Types

1. Install Supabase CLI (if not already):
   ```bash
   npm install -g supabase
   ```

2. Get your project reference ID:
   - In Supabase dashboard: **Settings** → **General** → **Reference ID**

3. Generate types:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
   ```

   Or use the npm script:
   ```bash
   pnpm supabase:types
   ```
   (You'll need to update the script with your project ID first)

---

## Step 9: Test the Connection

Create a test file to verify everything works:

```tsx
// app/test-supabase/page.tsx
import { createClient } from "lib/supabase/server"

export default async function TestSupabase() {
  const supabase = await createClient()
  
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .limit(5)
  
  if (error) {
    return <div>Error: {error.message}</div>
  }
  
  return (
    <div>
      <h1>Supabase Connection Test</h1>
      <pre>{JSON.stringify(services, null, 2)}</pre>
    </div>
  )
}
```

Visit `/test-supabase` to verify the connection works.

---

## Step 10: Enable Realtime (Optional for MVP)

For real-time updates on provider availability and request status:

1. Go to **Database** → **Replication**
2. Enable replication for:
   - `provider_availability` table
   - `requests` table (for status updates)
   - `request_dispatches` table

---

## Quick Reference

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public/anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only)

### Client Usage
- **Browser**: `import { createClient } from "lib/supabase/client"`
- **Server**: `import { createClient } from "lib/supabase/server"`
- **Admin**: `import { createAdminClient } from "lib/supabase/admin"`

### Common Queries
See `lib/supabase/README.md` for examples.

---

## Troubleshooting

**"Invalid API key"**
- Check your `.env.local` file has the correct keys
- Restart your dev server after changing env vars

**"Relation does not exist"**
- Make sure you've run all the SQL schema commands
- Check table names match exactly (case-sensitive)

**PostGIS errors**
- Ensure PostGIS extension is enabled
- Check that lat/lng values are valid (lat: -90 to 90, lng: -180 to 180)

**RLS blocking queries**
- Check your RLS policies allow the operation you're trying
- For MVP testing, you might temporarily disable RLS on specific tables

---

## Next Steps

After Supabase is set up:
1. ✅ Test connection with `/test-supabase` page
2. ✅ Generate TypeScript types
3. ✅ Build the 3-screen request flow
4. ✅ Implement provider matching algorithm
5. ✅ Set up Edge Functions for dispatch logic
