import { NextResponse } from "next/server"
import { z } from "zod"
import { getProviderSession } from "lib/provider/session"
import { createAdminClient } from "lib/supabase/admin"

const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
})

export async function GET() {
  const providerId = await getProviderSession()

  if (!providerId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("provider_availability")
    .select("is_available")
    .eq("provider_id", providerId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned (not an error, just no availability set yet)
    console.error("[Provider Availability] Failed to fetch:", error)
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    isAvailable: data?.is_available ?? false,
  })
}

export async function PATCH(request: Request) {
  const providerId = await getProviderSession()

  if (!providerId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { isAvailable } = updateAvailabilitySchema.parse(body)

    const supabase = createAdminClient()

    // Upsert availability (create if doesn't exist, update if does)
    const { error } = await supabase
      .from("provider_availability")
      .upsert(
        {
          provider_id: providerId,
          is_available: isAvailable,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "provider_id",
        }
      )

    if (error) {
      console.error("[Provider Availability] Failed to update:", error)
      return NextResponse.json(
        { error: "Failed to update availability" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      isAvailable,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    console.error("[Provider Availability] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
