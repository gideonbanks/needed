"use client"

import { useState } from "react"
import Link from "next/link"
import { Paragraph, styled, XStack, YStack } from "tamagui"
import { Button } from "components/Button/Button"
import { LogoImage } from "components/Logo/LogoImage"
import { ContentContainer, Subtitle, Title } from "components/styled/request-flow"
import { useTheme } from "lib/theme"
import { AUTH_CARD_BASE_STYLE, AUTH_LOGO_BADGE_STYLE } from "components/auth/cardStyles"

type RegisterTab = "provider" | "requester"

const RegisterCard = styled(YStack, {
  name: "RegisterCard",
  ...AUTH_CARD_BASE_STYLE,
})

const LogoBadge = styled(YStack, {
  name: "LogoBadge",
  ...AUTH_LOGO_BADGE_STYLE,
})

const TabButton = styled(YStack, {
  name: "TabButton",
  height: 40,
  borderRadius: "$2",
  borderWidth: 1,
  paddingHorizontal: "$4",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  variants: {
    active: {
      true: {
        backgroundColor: "$accent6",
        borderColor: "$accent6",
      },
      false: {
        backgroundColor: "transparent",
        borderColor: "$borderColor",
        hoverStyle: {
          backgroundColor: "$backgroundHover",
          borderColor: "$borderColorHover",
        },
        pressStyle: {
          backgroundColor: "$backgroundHover",
          borderColor: "$borderColorHover",
        },
      },
    },
  } as const,
})

export default function RegisterPage() {
  const [tab, setTab] = useState<RegisterTab>("provider")
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$4"
      minHeight="100vh"
      backgroundColor={isDark ? "$background" : "$gray1"}
    >
      <RegisterCard>
        <LogoBadge>
          <Link href="/" style={{ display: "flex", alignItems: "center" }}>
            <LogoImage variant={isDark ? "dark" : "light"} style={{ height: 28, width: "auto" }} />
          </Link>
        </LogoBadge>

        <ContentContainer>
          <Title>Get started</Title>
          <Subtitle marginBottom="$6">
            How do you want to use Needed?
          </Subtitle>

          <XStack gap="$2" marginBottom="$5">
            <TabButton active={tab === "provider"} flex={1} onPress={() => setTab("provider")}>
              <Paragraph fontSize="$3" fontWeight="600" color={tab === "provider" ? "white" : "$color"}>
                Provider
              </Paragraph>
            </TabButton>
            <TabButton active={tab === "requester"} flex={1} onPress={() => setTab("requester")}>
              <Paragraph fontSize="$3" fontWeight="600" color={tab === "requester" ? "white" : "$color"}>
                Customer
              </Paragraph>
            </TabButton>
          </XStack>

          {tab === "provider" ? (
            <YStack gap="$3">
              <Paragraph fontSize="$4" color="$colorSecondary">
                Register as a provider to receive job leads from customers in your area.
              </Paragraph>
              <Link href="/provider/signup" style={{ width: "100%" }}>
                <Button size="lg" width="100%">
                  Continue as Provider
                </Button>
              </Link>
            <Paragraph fontSize="$3" color="$colorSecondary">
              Already have an account?{" "}
              <Link href="/login" style={{ color: "inherit", fontWeight: 600 }}>
                Log in
              </Link>
            </Paragraph>
            </YStack>
          ) : (
            <YStack gap="$3">
              <YStack gap="$1">
                <Paragraph fontSize="$4" color="$colorSecondary">
                  <span style={{ fontSize: "150%", lineHeight: 1 }}>•</span>{" "}
                  No account needed to request a service.
                </Paragraph>
                <Paragraph fontSize="$4" color="$colorSecondary">
                  <span style={{ fontSize: "150%", lineHeight: 1 }}>•</span>{" "}
                  Create an account after you submit to manage your requests in one place.
                </Paragraph>
              </YStack>
              <Link href="/request" style={{ width: "100%" }}>
                <Button size="lg" width="100%">
                  Start a request
                </Button>
              </Link>
              <Paragraph fontSize="$3" color="$colorSecondary">
                It is free to request services
              </Paragraph>
            </YStack>
          )}
        </ContentContainer>
      </RegisterCard>
    </YStack>
  )
}

