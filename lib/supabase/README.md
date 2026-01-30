# Supabase Integration

This directory contains Supabase client utilities for Next.js App Router.

## Setup

1. **Create a Supabase project** at https://supabase.com

2. **Set environment variables** in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Generate TypeScript types** from your database schema:
   ```bash
   # Using Supabase CLI (recommended)
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
   
   # Or using the npm script
   pnpm supabase:types
   ```

## Usage

### Client Component (Browser)

```tsx
"use client"

import { createClient } from "lib/supabase/client"

export function MyComponent() {
  const supabase = createClient()
  
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
    
    if (error) console.error(error)
    return data
  }
  
  return <button onClick={fetchData}>Fetch</button>
}
```

### Server Component

```tsx
import { createClient } from "lib/supabase/server"

export default async function ServerPage() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('requests')
    .select('*')
  
  return <div>{/* render data */}</div>
}
```

### Server Action / API Route

```tsx
import { createClient } from "lib/supabase/server"

export async function createRequest(formData: FormData) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('requests')
    .insert({ /* data */ })
  
  return { data, error }
}
```

### Admin Client (Service Role)

⚠️ **Use with caution** - Only for server-side operations that require elevated permissions.

```tsx
import { createAdminClient } from "lib/supabase/admin"

// Only use in API routes or server actions
export async function adminOperation() {
  const supabase = createAdminClient()
  // Admin operations here
}
```

## Files

- `client.ts` - Browser client (use in Client Components)
- `server.ts` - Server client (use in Server Components, Server Actions, API Routes)
- `middleware.ts` - Middleware helper for session management
- `admin.ts` - Admin client with service role key (use sparingly)
- `types.ts` - Generated TypeScript types from your database schema

## Authentication

The middleware automatically refreshes user sessions. Protected routes can be handled in `middleware.ts`.

## Realtime

Supabase Realtime is available for:
- Provider availability updates
- Request status changes
- Live notifications

Example:
```tsx
const supabase = createClient()

const channel = supabase
  .channel('request-updates')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'requests' },
    (payload) => {
      console.log('Request updated:', payload)
    }
  )
  .subscribe()
```

## Storage

For job photos and other files:

```tsx
// Upload
const { data, error } = await supabase.storage
  .from('job-photos')
  .upload('path/to/file.jpg', file)

// Download
const { data } = await supabase.storage
  .from('job-photos')
  .createSignedUrl('path/to/file.jpg', 3600)
```

## PostGIS (Location Queries)

For location-based queries using PostGIS:

```tsx
const { data } = await supabase.rpc('find_providers_within_radius', {
  center_lat: -36.8485,
  center_lng: 174.7633,
  radius_km: 10
})
```

You'll need to create PostGIS functions in your Supabase database.
