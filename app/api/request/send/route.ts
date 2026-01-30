import { NextResponse } from "next/server"
import { z } from "zod"
import { verifySendToken } from "lib/request/sendToken"
import { createAdminClient } from "lib/supabase/admin"
import { env } from "../../../../env.mjs"

const sendRequestSchema = z.object({
  requestId: z.string().uuid(),
  sendToken: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { requestId, sendToken } = sendRequestSchema.parse(body)

    const supabase = createAdminClient()

    if (!env.REQUEST_SEND_TOKEN_SECRET) {
      return NextResponse.json(
        { error: "Request token secret is not configured" },
        { status: 500 }
      )
    }

    const tokenResult = verifySendToken(
      sendToken,
      env.REQUEST_SEND_TOKEN_SECRET
    )

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

    // Dispatch batch 1 (atomic: transitions draft -> sent and inserts request_dispatches)
    // Note: `lib/supabase/types.ts` may not include this RPC yet, so we cast to avoid `never`.
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
        data: Array<{ provider_id: string }> | null
        error: { message?: string } | null
      }>
    }

    const { data: dispatchedProviders, error: dispatchError } = await supabaseWithRpc.rpc(
      "dispatch_request_batch",
      {
        p_request_id: requestId,
        p_customer_id: tokenResult.payload.cid,
        p_batch_number: 1,
        p_limit: 3,
      }
    )

    if (dispatchError) {
      const rawMessage = dispatchError.message ?? ""
      const errorMap: Record<string, { message: string; status: number }> = {
        "Request already sent or status changed": {
          message: "Request already sent or status changed",
          status: 400,
        },
        "Request not found for customer": {
          message: "Request not found",
          status: 404,
        },
      }
      const matched = Object.entries(errorMap).find(([key]) =>
        rawMessage.includes(key)
      )
      const { message, status } = matched?.[1] ?? {
        message: "Failed to send request",
        status: 500,
      }

      return NextResponse.json({ error: message }, { status })
    }

    return NextResponse.json({
      success: true,
      message: "Request sent to providers",
      providerCount: dispatchedProviders?.length ?? 0,
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

    console.error("Unexpected error in send request:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
