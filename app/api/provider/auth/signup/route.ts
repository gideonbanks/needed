import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "lib/supabase/admin"
import { getTwilioClient, isTwilioConfigured } from "lib/twilio/client"
import { env } from "../../../../../env.mjs"

const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

const signupSchema = z.object({
  phone: z.string().min(1),
})

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Normalize NZ phone to E.164 format (+64...)
function normalizeNzPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "")
  if (cleaned.startsWith("+64")) {
    return cleaned
  }
  if (cleaned.startsWith("64")) {
    return "+" + cleaned
  }
  if (cleaned.startsWith("0")) {
    return "+64" + cleaned.slice(1)
  }
  return "+64" + cleaned
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone: rawPhone } = signupSchema.parse(body)
    const phone = normalizeNzPhone(rawPhone)

    const supabase = createAdminClient()

    // Check if provider already exists
    const { data: existingProvider } = await supabase
      .from("providers")
      .select("id, status")
      .eq("phone", phone)
      .single()

    if (existingProvider) {
      if (existingProvider.status === "approved") {
        return NextResponse.json(
          { error: "An account with this phone number already exists. Please log in instead." },
          { status: 409 }
        )
      }
      if (existingProvider.status === "pending") {
        // Provider exists but hasn't completed onboarding - resend OTP
        const otpCode = generateOtp()
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString()

        await supabase
          .from("providers")
          .update({
            otp_code: otpCode,
            otp_expires_at: otpExpiresAt,
          })
          .eq("id", existingProvider.id)

        // Send OTP
        if (isTwilioConfigured()) {
          const twilioClient = getTwilioClient()
          if (twilioClient) {
            try {
              await twilioClient.messages.create({
                body: `Your Needed verification code is: ${otpCode}`,
                from: env.TWILIO_FROM_NUMBER,
                to: phone,
              })
              console.log(`[Provider Signup] OTP resent to pending provider ${existingProvider.id}`)
            } catch (err) {
              console.error("[Provider Signup] Failed to send OTP SMS:", err)
            }
          }
        } else {
          console.log(`[Provider Signup] Mock OTP for ${phone}: ${otpCode}`)
        }

        return NextResponse.json({
          success: true,
          message: "OTP sent",
        })
      }
      if (existingProvider.status === "suspended") {
        return NextResponse.json(
          { error: "This account has been suspended. Please contact support." },
          { status: 403 }
        )
      }
    }

    // Create new provider
    const otpCode = generateOtp()
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString()

    const { data: newProvider, error: createError } = await supabase
      .from("providers")
      .insert({
        phone,
        status: "pending",
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt,
      })
      .select("id")
      .single()

    if (createError || !newProvider) {
      console.error("[Provider Signup] Failed to create provider:", createError)
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }

    // Send OTP via Twilio (or log in dev)
    if (isTwilioConfigured()) {
      const twilioClient = getTwilioClient()
      if (twilioClient) {
        try {
          await twilioClient.messages.create({
            body: `Your Needed verification code is: ${otpCode}`,
            from: env.TWILIO_FROM_NUMBER,
            to: phone,
          })
          console.log(`[Provider Signup] OTP sent to new provider ${newProvider.id}`)
        } catch (err) {
          console.error("[Provider Signup] Failed to send OTP SMS:", err)
        }
      }
    } else {
      console.log(`[Provider Signup] Mock OTP for ${phone}: ${otpCode}`)
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

    console.error("[Provider Signup] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
