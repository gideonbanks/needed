import { NextResponse } from "next/server"
import { z } from "zod"
import { createSendToken } from "lib/request/sendToken"
import { createClient } from "lib/supabase/server"
import { env } from "../../../../env.mjs"

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const rateLimitBuckets = new Map<string, number[]>()

// Periodically clean up stale entries to prevent memory leaks
// NOTE: This in-memory approach only works per-instance and won't share state
// across serverless function instances. This provides basic protection but should
// be replaced with a centralized solution (Upstash Redis, Vercel KV, Cloudflare Workers KV, etc.)
// for production at scale.
let cleanupInterval: NodeJS.Timeout | number | null = null

// Enable cleanup in both dev and production
cleanupInterval = setInterval(() => {
  const now = Date.now()
  rateLimitBuckets.forEach((timestamps, key) => {
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
    if (recent.length === 0) {
      rateLimitBuckets.delete(key)
    } else {
      rateLimitBuckets.set(key, recent)
    }
  })
}, RATE_LIMIT_WINDOW_MS)

// Clear interval on process exit (helps with hot module reloading in development)
if (typeof process !== "undefined") {
  const cleanup = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  }
  process.once("SIGTERM", cleanup)
  process.once("SIGINT", cleanup)
}

const createRequestSchema = z.object({
  serviceSlug: z.string().min(1),
  timeNeed: z.enum(["now", "today", "this-week"]),
  suburb: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  details: z.string().min(1),
  photoUrl: z.string().url().optional(),
  phone: z
    .string()
    .min(1)
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone format"),
})

const getClientKey = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0]?.trim()
    if (ip) {
      return ip
    }
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  if (process.env.NODE_ENV === "production") {
    return null
  }

  const userAgent = request.headers.get("user-agent") || "unknown"
  const acceptLanguage = request.headers.get("accept-language") || ""
  return `dev:${userAgent}:${acceptLanguage}`
}

const isRateLimited = (clientKey: string) => {
  const now = Date.now()
  const bucket = rateLimitBuckets.get(clientKey) || []
  const recent = bucket.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(clientKey, recent)
    return true
  }
  recent.push(now)
  rateLimitBuckets.set(clientKey, recent)
  return false
}

export async function POST(request: Request) {
  try {
    // Apply rate limiting in both dev and production
    // NOTE: In-memory rate limiting provides per-instance protection.
    // For production at scale, consider upgrading to a centralized solution
    // (Upstash Redis, Vercel KV, Cloudflare Workers KV) for cross-instance rate limiting.
    const clientKey = getClientKey(request)

    if (!clientKey) {
      // clientKey is only null in production when IP headers are missing
      return NextResponse.json(
        { error: "Unable to verify request origin." },
        { status: 400 }
      )
    }

    if (isRateLimited(clientKey)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": "60" } }
      )
    }

    const body = await request.json()
    const validated = createRequestSchema.parse(body)

    const supabase = await createClient()

    // Get service ID from slug
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("slug", validated.serviceSlug)
      .eq("is_active", true)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      )
    }

    // Get or create customer by phone using upsert to avoid race conditions
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert({ phone: validated.phone }, { onConflict: "phone" })
      .select("id")
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: "Failed to resolve customer" },
        { status: 500 }
      )
    }

    // Create request
    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .insert({
        customer_id: customer.id,
        service_id: service.id,
        time_need: validated.timeNeed,
        suburb_text: validated.suburb,
        lat: validated.lat,
        lng: validated.lng,
        details: validated.details,
        photo_url: validated.photoUrl,
        status: "draft",
      })
      .select("id")
      .single()

    if (requestError) {
      console.error("Request creation error:", requestError)
      return NextResponse.json(
        { error: "Failed to create request" },
        { status: 500 }
      )
    }

    if (!env.REQUEST_SEND_TOKEN_SECRET) {
      return NextResponse.json(
        { error: "Request token secret is not configured" },
        { status: 500 }
      )
    }

    const sendToken = createSendToken(
      requestData.id,
      customer.id,
      env.REQUEST_SEND_TOKEN_SECRET
    )

    return NextResponse.json({
      success: true,
      requestId: requestData.id,
      sendToken,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
