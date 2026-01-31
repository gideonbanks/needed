"use client"

import { Paragraph, YStack } from "tamagui"
import { DashboardContent, DashboardTitle, SectionTitle } from "components/styled/provider-dashboard"

const SUPPORT_EMAIL = "support@needed.nz"

export default function ProviderSupportPage() {
  return (
    <DashboardContent>
      <DashboardTitle>Support</DashboardTitle>

      <YStack gap="$3">
        <Paragraph color="$colorSecondary">
          Need a hand with jobs, credits, or your profile? Reach out and we’ll help.
        </Paragraph>

        <YStack gap="$2">
          <SectionTitle>Contact</SectionTitle>
          <Paragraph>
            Email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "inherit", textDecoration: "underline" }}>
              {SUPPORT_EMAIL}
            </a>
          </Paragraph>
        </YStack>
      </YStack>
    </DashboardContent>
  )
}

