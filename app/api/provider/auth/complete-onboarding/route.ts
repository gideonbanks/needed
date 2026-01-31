import { NextResponse } from "next/server"
import { getProviderSession } from "lib/provider/session"
import { createAdminClient } from "lib/supabase/admin"

export async function POST() {
  const providerId = await getProviderSession()

  if (!providerId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const supabase = createAdminClient()

  // Fetch current provider
  const { data: provider, error: fetchError } = await supabase
    .from("providers")
    .select("id, status, name")
    .eq("id", providerId)
    .single()

  if (fetchError || !provider) {
    console.error("[Complete Onboarding] Provider not found:", fetchError)
    return NextResponse.json(
      { error: "Provider not found" },
      { status: 404 }
    )
  }

  // Only allow completing onboarding for pending providers
  if (provider.status !== "pending") {
    return NextResponse.json(
      { error: "Onboarding already completed" },
      { status: 400 }
    )
  }

  // Verify provider has required data
  if (!provider.name) {
    return NextResponse.json(
      { error: "Please complete your profile before finishing onboarding" },
      { status: 400 }
    )
  }

  // Check if provider has at least one service
  const { count: serviceCount } = await supabase
    .from("provider_services")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)

  if (!serviceCount || serviceCount === 0) {
    return NextResponse.json(
      { error: "Please select at least one service" },
      { status: 400 }
    )
  }

  // Check if provider has at least one area
  const { count: areaCount } = await supabase
    .from("provider_areas")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)

  if (!areaCount || areaCount === 0) {
    return NextResponse.json(
      { error: "Please add at least one service area" },
      { status: 400 }
    )
  }

  // Set status to approved
  const { error: updateError } = await supabase
    .from("providers")
    .update({ status: "approved" })
    .eq("id", providerId)

  if (updateError) {
    console.error("[Complete Onboarding] Failed to update status:", updateError)
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    )
  }

  // Create initial availability record (default: not available)
  await supabase
    .from("provider_availability")
    .upsert({
      provider_id: providerId,
      is_available: false,
    })
    .eq("provider_id", providerId)

  console.log(`[Complete Onboarding] Provider ${providerId} onboarding complete`)

  return NextResponse.json({
    success: true,
    message: "Onboarding complete",
  })
}
