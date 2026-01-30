import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"
import { env } from "../../env.mjs"

// Admin client for server-side operations (use with caution)
// Only use this for operations that require service role permissions
export function createAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    }
  )
}
