import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getProviderSession } from "lib/provider/session"
import { createAdminClient } from "lib/supabase/admin"
import { calculateCreditCost } from "lib/provider/constants"

const actionSchema = z.object({
  dispatchId: z.string().uuid(),
  actionType: z.enum(["call", "text"]),
})

/**
 * POST /api/provider/action
 *
 * Records a provider contact action (call/text) and deducts credits.
 * This is the billing trigger per NEEDED.md Section 8.
 */
export async function POST(request: NextRequest) {
  const providerId = await getProviderSession()

  if (!providerId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { dispatchId, actionType } = parsed.data
  const supabase = createAdminClient()

  // 1. Get the dispatch and request details
  const { data: dispatch, error: dispatchError } = await supabase
    .from("request_dispatches")
    .select(`
      id,
      request_id,
      provider_id,
      requests!inner (
        id,
        status,
        time_need,
        services!inner (
          slug
        ),
        customers!inner (
          phone
        )
      )
    `)
    .eq("id", dispatchId)
    .eq("provider_id", providerId)
    .single()

  if (dispatchError || !dispatch) {
    console.error("[Provider Action] Dispatch not found:", dispatchError)
    return NextResponse.json(
      { error: "Lead not found or not assigned to you" },
      { status: 404 }
    )
  }

  const requestData = dispatch.requests as {
    id: string
    status: string
    time_need: "now" | "today" | "this-week"
    services: { slug: string }
    customers: { phone: string }
  }

  // 2. Check if already contacted this request (prevent double charge)
  const { data: existingAction } = await supabase
    .from("provider_actions")
    .select("id")
    .eq("request_id", requestData.id)
    .eq("provider_id", providerId)
    .eq("charge_status", "charged")
    .maybeSingle()

  if (existingAction) {
    // Already charged - just return the contact info without charging again
    return NextResponse.json({
      success: true,
      alreadyContacted: true,
      customerPhone: requestData.customers.phone,
      message: "You've already contacted this customer",
    })
  }

  // 3. Calculate credit cost
  const creditCost = calculateCreditCost(requestData.services.slug, requestData.time_need)

  // 4. Get provider's current credits
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("credits")
    .eq("id", providerId)
    .single()

  if (providerError || !provider) {
    console.error("[Provider Action] Provider not found:", providerError)
    return NextResponse.json(
      { error: "Provider not found" },
      { status: 404 }
    )
  }

  // 5. Check if provider has enough credits
  if (provider.credits < creditCost) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        required: creditCost,
        available: provider.credits,
      },
      { status: 402 } // Payment Required
    )
  }

  // 6. Deduct credits and log action in a transaction-like manner
  // First, deduct credits
  const { error: creditError } = await supabase
    .from("providers")
    .update({ credits: provider.credits - creditCost })
    .eq("id", providerId)
    .eq("credits", provider.credits) // Optimistic lock

  if (creditError) {
    console.error("[Provider Action] Failed to deduct credits:", creditError)
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    )
  }

  // 7. Log the action
  const { error: actionError } = await supabase
    .from("provider_actions")
    .insert({
      request_id: requestData.id,
      provider_id: providerId,
      dispatch_id: dispatchId,
      action_type: actionType,
      credit_cost: creditCost,
      charge_status: "charged",
    })

  if (actionError) {
    // Attempt to refund credits if action logging failed
    console.error("[Provider Action] Failed to log action:", actionError)
    await supabase
      .from("providers")
      .update({ credits: provider.credits })
      .eq("id", providerId)

    return NextResponse.json(
      { error: "Failed to record contact action" },
      { status: 500 }
    )
  }

  // 8. Return success with customer contact info
  return NextResponse.json({
    success: true,
    customerPhone: requestData.customers.phone,
    creditCost,
    newBalance: provider.credits - creditCost,
    actionType,
  })
}
