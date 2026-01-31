import { NextResponse } from "next/server"
import { z } from "zod"
import { getProviderSession } from "lib/provider/session"
import { createAdminClient } from "lib/supabase/admin"

const areaSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(100),
  displayName: z.string().max(200).optional(),
})

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  businessName: z.string().min(1).max(100).optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
  areas: z.array(areaSchema).optional(),
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

  // Fetch provider with services and areas
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select(`
      id,
      phone,
      name,
      avatar_url,
      business_name,
      status,
      credits,
      created_at,
      provider_services (
        services (
          id,
          name,
          slug
        )
      ),
      provider_areas (
        id,
        lat,
        lng,
        radius_km,
        display_name
      )
    `)
    .eq("id", providerId)
    .single()

  if (providerError || !provider) {
    console.error("[Provider Me] Failed to fetch profile:", providerError)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }

  // Transform the data
  const services = (provider.provider_services as Array<{ services: { id: string; name: string; slug: string } }>)
    .map((ps) => ps.services)

  const areas = (provider.provider_areas as Array<{ id: string; lat: number; lng: number; radius_km: number; display_name: string | null }>)
    .map((area) => ({
      id: area.id,
      lat: area.lat,
      lng: area.lng,
      radiusKm: area.radius_km,
      displayName: area.display_name,
    }))

  return NextResponse.json({
    id: provider.id,
    phone: provider.phone,
    name: provider.name,
    avatarUrl: provider.avatar_url,
    businessName: provider.business_name,
    status: provider.status,
    credits: provider.credits ?? 0,
    createdAt: provider.created_at,
    services,
    areas,
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
    const { name, businessName, serviceIds, areas } = updateProfileSchema.parse(body)

    const supabase = createAdminClient()

    // Update name and/or business name if provided
    const providerUpdates: { name?: string; business_name?: string } = {}
    if (name !== undefined) {
      providerUpdates.name = name
    }
    if (businessName !== undefined) {
      providerUpdates.business_name = businessName
    }

    if (Object.keys(providerUpdates).length > 0) {
      const { error } = await supabase
        .from("providers")
        .update(providerUpdates)
        .eq("id", providerId)

      if (error) {
        console.error("[Provider Me] Failed to update provider:", error)
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        )
      }
    }

    // Update services if provided
    if (serviceIds !== undefined) {
      // Delete existing provider services
      const { error: deleteError } = await supabase
        .from("provider_services")
        .delete()
        .eq("provider_id", providerId)

      if (deleteError) {
        console.error("[Provider Me] Failed to delete existing services:", deleteError)
        return NextResponse.json(
          { error: "Failed to update services" },
          { status: 500 }
        )
      }

      // Insert new provider services
      if (serviceIds.length > 0) {
        const providerServices = serviceIds.map((serviceId) => ({
          provider_id: providerId,
          service_id: serviceId,
        }))

        const { error: insertError } = await supabase
          .from("provider_services")
          .insert(providerServices)

        if (insertError) {
          console.error("[Provider Me] Failed to insert services:", insertError)
          return NextResponse.json(
            { error: "Failed to update services" },
            { status: 500 }
          )
        }
      }
    }

    // Update areas if provided
    if (areas !== undefined) {
      // Delete existing provider areas
      const { error: deleteError } = await supabase
        .from("provider_areas")
        .delete()
        .eq("provider_id", providerId)

      if (deleteError) {
        console.error("[Provider Me] Failed to delete existing areas:", deleteError)
        return NextResponse.json(
          { error: "Failed to update areas" },
          { status: 500 }
        )
      }

      // Insert new provider areas
      if (areas.length > 0) {
        const providerAreas = areas.map((area) => ({
          provider_id: providerId,
          lat: area.lat,
          lng: area.lng,
          radius_km: area.radiusKm,
          display_name: area.displayName || null,
        }))

        const { error: insertError } = await supabase
          .from("provider_areas")
          .insert(providerAreas)

        if (insertError) {
          console.error("[Provider Me] Failed to insert areas:", insertError)
          return NextResponse.json(
            { error: "Failed to update areas" },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated",
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

    console.error("[Provider Me] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
