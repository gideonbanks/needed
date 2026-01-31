import { getTwilioClient, isTwilioConfigured } from "./client"
import { env } from "../../env.mjs"
import { createAdminClient } from "../supabase/admin"

interface RequestDetails {
  serviceName: string
  suburb: string
  details: string
  timeNeed: string
  customerPhone: string
}

function formatTimeNeed(timeNeed: string): string {
  switch (timeNeed) {
    case "now":
      return "URGENT - Now"
    case "today":
      return "Today"
    case "this-week":
      return "This week"
    default:
      return timeNeed
  }
}

function buildSmsMessage(request: RequestDetails): string {
  const detailsPreview = request.details.length > 100
    ? request.details.slice(0, 100) + "..."
    : request.details

  return `New ${request.serviceName} job in ${request.suburb}!

${detailsPreview}

Timing: ${formatTimeNeed(request.timeNeed)}

Call customer: ${request.customerPhone}`
}

export async function notifyProviders(
  providerIds: string[],
  requestId: string
): Promise<void> {
  if (!isTwilioConfigured()) {
    console.log("[Twilio] Not configured, skipping SMS notifications")
    return
  }

  if (providerIds.length === 0) {
    console.log("[Twilio] No providers to notify")
    return
  }

  const twilioClient = getTwilioClient()
  if (!twilioClient) {
    console.log("[Twilio] Client not available")
    return
  }

  try {
    const supabase = createAdminClient()

    // Fetch request details with service name and customer phone
    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select(`
        suburb_text,
        details,
        time_need,
        services!inner(name),
        customers!inner(phone)
      `)
      .eq("id", requestId)
      .single()

    if (requestError || !requestData) {
      console.error("[Twilio] Failed to fetch request details:", requestError)
      return
    }

    const request: RequestDetails = {
      serviceName: (requestData.services as { name: string }).name,
      suburb: requestData.suburb_text,
      details: requestData.details,
      timeNeed: requestData.time_need,
      customerPhone: (requestData.customers as { phone: string }).phone,
    }

    // Fetch provider phone numbers
    const { data: providers, error: providersError } = await supabase
      .from("providers")
      .select("id, phone, business_name")
      .in("id", providerIds)

    if (providersError || !providers) {
      console.error("[Twilio] Failed to fetch providers:", providersError)
      return
    }

    const message = buildSmsMessage(request)

    // Send SMS to each provider (fire-and-forget, don't await all)
    for (const provider of providers) {
      twilioClient.messages
        .create({
          body: message,
          from: env.TWILIO_FROM_NUMBER,
          to: provider.phone,
        })
        .then(() => {
          console.log(`[Twilio] SMS sent to ${provider.business_name || provider.id}`)
        })
        .catch((err) => {
          console.error(`[Twilio] Failed to send SMS to ${provider.business_name || provider.id}:`, err.message)
        })
    }

    console.log(`[Twilio] Initiated ${providers.length} SMS notifications for request ${requestId}`)
  } catch (err) {
    console.error("[Twilio] Error in notifyProviders:", err)
  }
}
