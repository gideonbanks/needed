import {
  PageContainer,
  ThemeToggleContainer,
} from "components/styled/request-flow"
import { ThemeToggle } from "components/ThemeToggle/ThemeToggle"

export default function RequestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PageContainer position="relative">
      <ThemeToggleContainer>
        <ThemeToggle />
      </ThemeToggleContainer>
      {children}
    </PageContainer>
  )
}
