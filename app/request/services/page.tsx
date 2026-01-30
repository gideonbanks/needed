import { env } from "env.mjs"
import { createClient } from "lib/supabase/server"
import { AllServicesClient } from "./AllServicesClient"

interface Service {
  id: string
  name: string
  slug: string
  is_active: boolean
}

const DEFAULT_SERVICES: Service[] = [
  { id: "plumber", slug: "plumber", name: "Plumber", is_active: true },
  { id: "electrician", slug: "electrician", name: "Electrician", is_active: true },
  { id: "locksmith", slug: "locksmith", name: "Locksmith", is_active: true },
  { id: "movers", slug: "movers", name: "Movers", is_active: true },
  { id: "carpet-cleaning", slug: "carpet-cleaning", name: "Carpet Cleaning", is_active: true },
  { id: "rubbish-removal", slug: "rubbish-removal", name: "Rubbish Removal", is_active: true },
  { id: "house-cleaning", slug: "house-cleaning", name: "House Cleaners", is_active: true },
  { id: "heat-pump-servicing", slug: "heat-pump-servicing", name: "Heat Pump Servicing", is_active: true },
  { id: "handyman", slug: "handyman", name: "Handyman", is_active: true },
  { id: "lawn-mowing", slug: "lawn-mowing", name: "Lawn Mowing", is_active: true },
]

const isSupabaseConfigured = () => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false
  if (url.startsWith("your-") || key.startsWith("your-")) return false
  return true
}

let hasWarnedServicesFallback = false
const warnServicesFallbackOnce = (message: string) => {
  if (hasWarnedServicesFallback) return
  hasWarnedServicesFallback = true
  console.warn(message)
}

async function fetchServices(): Promise<Service[]> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("Supabase is not configured in production - using fallback services")
      // Optionally throw instead:
      // throw new Error("Supabase is not configured")
    }
    return DEFAULT_SERVICES
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("services")
      .select("id, name, slug, is_active")
      .eq("is_active", true)
      .order("name")

    if (error) {
      const message = error.message || "Unknown Supabase error"
      if (process.env.NODE_ENV !== "production") {
        // Avoid flooding the dev overlay/console with errors during setup.
        // Common case: services table not created yet (PGRST205).
        warnServicesFallbackOnce(
          `Using built-in services list because Supabase services query failed: ${message}` +
            (error.code ? ` (code: ${error.code})` : "")
        )
        return DEFAULT_SERVICES
      }
      // In prod, fail loudly so we don't silently ship incorrect data.
      console.error(
        `Error fetching services: ${message}` +
          (error.code ? ` (code: ${error.code})` : "") +
          (error.details ? `\nDetails: ${error.details}` : "") +
          (error.hint ? `\nHint: ${error.hint}` : "")
      )
      throw new Error(`Failed to load services: ${message}`)
    }

    return data || []
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      warnServicesFallbackOnce(
        `Using built-in services list because Supabase init/query threw: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
      return DEFAULT_SERVICES
    }
    console.error(
      `Error fetching services (exception): ${
        err instanceof Error ? err.message : String(err)
      }`
    )
    throw err
  }
}

export default async function AllServicesPage() {
  const services = await fetchServices()

  return <AllServicesClient services={services} />
}
