// Provider root layout - just passes through children
// Auth is handled by the (dashboard) route group layout
export default function ProviderRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
