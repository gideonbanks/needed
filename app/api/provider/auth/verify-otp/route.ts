import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "lib/supabase/admin"
import { setProviderSession } from "lib/provider/session"
import { env } from "../../../../../env.mjs"

const MOCK_OTP = "123456"

const verifyOtpSchema = z.object({
  phone: z.string().min(1),
  code: z.string().length(6),
})

// Normalize NZ phone to local format (021...)
function normalizeNzPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "")
  if (cleaned.startsWith("+64")) {
    return "0" + cleaned.slice(3)
  }
  if (cleaned.startsWith("64") && cleaned.length > 2) {
    return "0" + cleaned.slice(2)
  }
  if (cleaned.startsWith("0")) {
    return cleaned
  }
  return "0" + cleaned
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone: rawPhone, code } = verifyOtpSchema.parse(body)
    const phone = normalizeNzPhone(rawPhone)

    const supabase = createAdminClient()

    // Fetch provider with OTP
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, phone, status, business_name, otp_code, otp_expires_at")
      .eq("phone", phone)
      .single()

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      )
    }

    if (provider.status !== "approved") {
      return NextResponse.json(
        { error: "Provider account is not approved" },
        { status: 403 }
      )
    }

    // Check mock OTP in development
    const isMockOtpEnabled =
      env.NEXT_PUBLIC_ENABLE_MOCK_OTP === true ||
      process.env.NODE_ENV === "development"
    const isMockOtpValid = isMockOtpEnabled && code === MOCK_OTP

    // Verify OTP
    if (!isMockOtpValid) {
      if (!provider.otp_code || !provider.otp_expires_at) {
        return NextResponse.json(
          { error: "No OTP requested" },
          { status: 400 }
        )
      }

      const isExpired = new Date(provider.otp_expires_at) < new Date()
      if (isExpired) {
        return NextResponse.json(
          { error: "OTP expired" },
          { status: 400 }
        )
      }

      if (provider.otp_code !== code) {
        return NextResponse.json(
          { error: "Invalid OTP" },
          { status: 400 }
        )
      }
    }

    // Clear OTP from database
    await supabase
      .from("providers")
      .update({
        otp_code: null,
        otp_expires_at: null,
      })
      .eq("id", provider.id)

    // Set session cookie
    await setProviderSession(provider.id)

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        phone: provider.phone,
        businessName: provider.business_name,
      },
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

    console.error("[Provider Auth] Unexpected error in verify-otp:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
