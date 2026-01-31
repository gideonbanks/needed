import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "lib/supabase/admin"
import { getTwilioClient, isTwilioConfigured } from "lib/twilio/client"
import { env } from "../../../../../env.mjs"

const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

const sendOtpSchema = z.object({
  phone: z.string().min(1),
})

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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
    const { phone: rawPhone } = sendOtpSchema.parse(body)
    const phone = normalizeNzPhone(rawPhone)

    const supabase = createAdminClient()

    // Check if provider exists and is approved
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, phone, status, business_name")
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

    // Generate OTP and store in database
    const otpCode = generateOtp()
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString()

    const { error: updateError } = await supabase
      .from("providers")
      .update({
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt,
      })
      .eq("id", provider.id)

    if (updateError) {
      console.error("[Provider Auth] Failed to store OTP:", updateError)
      return NextResponse.json(
        { error: "Failed to generate OTP" },
        { status: 500 }
      )
    }

    // Send OTP via Twilio (or log in dev)
    if (isTwilioConfigured()) {
      const twilioClient = getTwilioClient()
      if (twilioClient) {
        try {
          await twilioClient.messages.create({
            body: `Your Needed provider login code is: ${otpCode}`,
            from: env.TWILIO_FROM_NUMBER,
            to: phone,
          })
          console.log(`[Provider Auth] OTP sent to ${provider.business_name || provider.id}`)
        } catch (err) {
          console.error("[Provider Auth] Failed to send OTP SMS:", err)
          // Don't fail the request - allow mock OTP in dev
        }
      }
    } else {
      console.log(`[Provider Auth] Mock OTP for ${phone}: ${otpCode}`)
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent",
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

    console.error("[Provider Auth] Unexpected error in send-otp:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
