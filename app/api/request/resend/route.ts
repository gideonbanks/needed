import { NextResponse } from "next/server"
import { z } from "zod"
import { verifySendToken } from "lib/request/sendToken"
import { createAdminClient } from "lib/supabase/admin"
import { notifyProviders } from "lib/twilio/notify"
import { env } from "../../../../env.mjs"

const resendRequestSchema = z.object({
  requestId: z.string().uuid(),
  sendToken: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { requestId, sendToken } = resendRequestSchema.parse(body)

    if (!env.REQUEST_SEND_TOKEN_SECRET) {
      console.error("REQUEST_SEND_TOKEN_SECRET is not configured")
      return NextResponse.json(
        { error: "Request token secret is not configured" },
        { status: 500 }
      )
    }

    const tokenResult = verifySendToken(sendToken, env.REQUEST_SEND_TOKEN_SECRET)
    if (!tokenResult.valid || !tokenResult.payload) {
      return NextResponse.json(
        { error: tokenResult.error || "Invalid token" },
        { status: 401 }
      )
    }

    if (tokenResult.payload.rid !== requestId) {
      return NextResponse.json(
        { error: "Token does not match request" },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Dispatch batch 2 (idempotent: unique(request_id, provider_id) prevents duplicates).
    // Note: `lib/supabase/types.ts` may not include this RPC yet, so we cast to avoid `never`.
    // TODO: Remove this cast once dispatch_request_batch is added to generated types.
    const supabaseWithRpc = supabase as unknown as {
      rpc: (
        fn: string,
        args: {
          p_request_id: string
          p_customer_id: string
          p_batch_number: number
          p_limit: number
        }
      ) => Promise<{
        data: Array<{ matched_provider_id: string }> | null
        error: { message?: string } | null
      }>
    }

    const { data: dispatchedProviders, error: dispatchError } =
      await supabaseWithRpc.rpc("dispatch_request_batch", {
        p_request_id: requestId,
        p_customer_id: tokenResult.payload.cid,
        p_batch_number: 2,
        p_limit: 3,
      })

    if (dispatchError) {
      const rawMessage = dispatchError.message ?? ""
      // Batch 2+ never hits the "already sent" branch (that only applies to batch 1).
      // We only special-case "not found" here; everything else is a generic failure.
      const message = rawMessage.includes("Request not found for customer")
        ? "Request not found"
        : "Failed to resend request"

      return NextResponse.json(
        { error: message },
        { status: message === "Request not found" ? 404 : 500 }
      )
    }

    // Notify providers via SMS (fire-and-forget)
    const providerIds = dispatchedProviders?.map((p) => p.matched_provider_id) ?? []
    if (providerIds.length > 0) {
      notifyProviders(providerIds, requestId).catch((err) => {
        console.error("Failed to notify providers:", err)
      })
    }

    return NextResponse.json({
      success: true,
      message: "Request re-sent to providers",
      providerCount: dispatchedProviders?.length ?? 0,
      batchNumber: 2,
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

    console.error("Unexpected error in resend request:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
