import Twilio from "twilio"
import { env } from "../../env.mjs"

let twilioClient: Twilio.Twilio | null = null

export function getTwilioClient(): Twilio.Twilio | null {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return null
  }

  if (!twilioClient) {
    twilioClient = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  }

  return twilioClient
}

export function isTwilioConfigured(): boolean {
  return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER)
}
