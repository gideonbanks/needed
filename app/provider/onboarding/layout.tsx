import { redirect } from "next/navigation"
import { getProviderSession } from "lib/provider/session"
import { createAdminClient } from "lib/supabase/admin"

export default async function ProviderOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const providerId = await getProviderSession()

  if (!providerId) {
    redirect("/provider/signup")
  }

  // Check provider status - redirect approved providers to dashboard
  const supabase = createAdminClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("status")
    .eq("id", providerId)
    .single()

  if (provider?.status === "approved") {
    redirect("/provider")
  }

  if (provider?.status === "suspended") {
    redirect("/provider/login")
  }

  return <>{children}</>
}
