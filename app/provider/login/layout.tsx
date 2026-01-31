import { redirect } from "next/navigation"
import { getProviderSession } from "lib/provider/session"
import { PageContainer, ThemeToggleContainer } from "components/styled/request-flow"
import { ThemeToggle } from "components/ThemeToggle/ThemeToggle"

export default async function ProviderLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // If already logged in, redirect to dashboard
  const providerId = await getProviderSession()
  if (providerId) {
    redirect("/provider")
  }

  return (
    <PageContainer position="relative">
      <ThemeToggleContainer>
        <ThemeToggle />
      </ThemeToggleContainer>
      {children}
    </PageContainer>
  )
}
