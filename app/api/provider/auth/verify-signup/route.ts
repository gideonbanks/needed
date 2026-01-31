import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "lib/supabase/admin"
import { setProviderSession } from "lib/provider/session"
import { env } from "../../../../../env.mjs"

const MOCK_OTP = "123456"

const verifySignupSchema = z.object({
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
    const { phone: rawPhone, code } = verifySignupSchema.parse(body)
    const phone = normalizeNzPhone(rawPhone)

    const supabase = createAdminClient()

    // Fetch provider with OTP
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, phone, status, otp_code, otp_expires_at")
      .eq("phone", phone)
      .single()

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Account not found. Please sign up first." },
        { status: 404 }
      )
    }

    // For signup verification, we allow pending status
    if (provider.status === "suspended") {
      return NextResponse.json(
        { error: "This account has been suspended. Please contact support." },
        { status: 403 }
      )
    }

    // If already approved, redirect to login
    if (provider.status === "approved") {
      return NextResponse.json(
        { error: "Account already verified. Please log in instead." },
        { status: 409 }
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
          { error: "No verification code requested. Please request a new code." },
          { status: 400 }
        )
      }

      const isExpired = new Date(provider.otp_expires_at) < new Date()
      if (isExpired) {
        return NextResponse.json(
          { error: "Verification code expired. Please request a new code." },
          { status: 400 }
        )
      }

      if (provider.otp_code !== code) {
        return NextResponse.json(
          { error: "Invalid verification code" },
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
        status: provider.status,
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

    console.error("[Provider Verify Signup] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
