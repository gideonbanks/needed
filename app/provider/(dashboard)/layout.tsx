import { redirect } from "next/navigation"
import { getProviderSession } from "lib/provider/session"
import { createAdminClient } from "lib/supabase/admin"
import { AvailabilityProvider } from "lib/provider/availability-context"
import { DashboardContainer } from "components/styled/provider-dashboard"
import { ProviderHeader } from "../components/ProviderHeader"

export default async function ProviderDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const providerId = await getProviderSession()

  if (!providerId) {
    redirect("/provider/login")
  }

  // Check provider status - redirect pending providers to onboarding
  const supabase = createAdminClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("status")
    .eq("id", providerId)
    .single()

  if (provider?.status === "pending") {
    redirect("/provider/onboarding")
  }

  return (
    <AvailabilityProvider>
      <DashboardContainer>
        <ProviderHeader providerId={providerId} />
        {children}
      </DashboardContainer>
    </AvailabilityProvider>
  )
}
