import { NextResponse } from "next/server"
import { getProviderSession } from "lib/provider/session"
import { createAdminClient } from "lib/supabase/admin"

export async function GET() {
  const providerId = await getProviderSession()

  if (!providerId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const supabase = createAdminClient()

  // Fetch dispatched jobs for this provider
  const { data: dispatches, error } = await supabase
    .from("request_dispatches")
    .select(`
      id,
      batch_number,
      dispatched_at,
      requests!inner (
        id,
        suburb_text,
        details,
        time_need,
        status,
        created_at,
        services!inner (
          name,
          slug
        ),
        customers!inner (
          phone
        )
      )
    `)
    .eq("provider_id", providerId)
    .order("dispatched_at", { ascending: false })

  if (error) {
    console.error("[Provider Jobs] Failed to fetch jobs:", error)
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    )
  }

  // Transform the data for the frontend
  const jobs = dispatches.map((dispatch) => {
    const request = dispatch.requests as {
      id: string
      suburb_text: string
      details: string
      time_need: string
      status: string
      created_at: string
      services: { name: string; slug: string }
      customers: { phone: string }
    }

    return {
      id: dispatch.id,
      requestId: request.id,
      serviceName: request.services.name,
      serviceSlug: request.services.slug,
      suburb: request.suburb_text,
      details: request.details,
      timeNeed: request.time_need,
      status: request.status,
      customerPhone: request.customers.phone,
      dispatchedAt: dispatch.dispatched_at,
      batchNumber: dispatch.batch_number,
    }
  })

  return NextResponse.json({ jobs })
}
