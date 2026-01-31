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

  const { data: services, error } = await supabase
    .from("services")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name")

  if (error) {
    console.error("[Provider Services] Failed to fetch services:", error)
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    )
  }

  return NextResponse.json({ services })
}
