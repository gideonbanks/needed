"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Coins, LifeBuoy, LogOut, Menu, Moon, Sun, User as UserIcon } from "@tamagui/lucide-icons"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import type { KeyboardEvent } from "react"
import { useEffect, useState } from "react"
import { Paragraph, styled, XStack, YStack } from "tamagui"
import {
  Header,
  HeaderMenuButton,
  HeaderThemeButton,
  HeaderUserButton,
  HeaderUserAvatar,
  HeaderUserLabel,
} from "components/Header/Header"
import { handleKeyActivate, handleKeyClick } from "components/Header/keyboard"
import { useAvailability } from "lib/provider/availability-context"
import { useTheme } from "lib/theme"

interface ProviderProfile {
  name: string | null
  avatarUrl: string | null
  credits: number
}

const StatusDotOuter = styled(YStack, {
  name: "StatusDotOuter",
  width: 18,
  height: 18,
  borderRadius: 9,
  alignItems: "center",
  justifyContent: "center",
  variants: {
    available: {
      true: {
        backgroundColor: "rgba(34, 197, 94, 0.25)",
      },
      false: {
        backgroundColor: "rgba(156, 163, 175, 0.25)",
      },
    },
  } as const,
  defaultVariants: {
    available: false,
  },
})

const StatusDotInner = styled(YStack, {
  name: "StatusDotInner",
  width: 10,
  height: 10,
  borderRadius: 5,
  variants: {
    available: {
      true: {
        backgroundColor: "#22c55e",
      },
      false: {
        backgroundColor: "#9ca3af",
      },
    },
  } as const,
  defaultVariants: {
    available: false,
  },
})

interface ProviderHeaderProps {
  providerId: string
}

export function ProviderHeader(_props: ProviderHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { isAvailable, loading } = useAvailability()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)

  const handleKeyToggleTheme = (event: KeyboardEvent<HTMLElement>) => {
    handleKeyActivate(event, toggleTheme)
  }

  useEffect(() => {
    fetch("/api/provider/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setProfile({
            name: data.name,
            avatarUrl: data.avatarUrl,
            credits: data.credits ?? 0,
          })
        }
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await fetch("/api/provider/auth/logout", { method: "POST" })
    router.push("/provider/login")
  }

  const leftContent = (
    <XStack gap={5} alignItems="center">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <HeaderMenuButton
            role="button"
            aria-label="Open provider menu"
            tabIndex={0}
            onKeyDown={handleKeyClick}
          >
            <Menu size={20} color="white" />
          </HeaderMenuButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={10}
            style={{
              backgroundColor: "white",
              borderRadius: 8,
              padding: 4,
              minWidth: 180,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 1001,
            }}
          >
            <DropdownMenu.Item asChild>
              <Link
                href="/provider"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 4,
                  textDecoration: "none",
                  color: "#333",
                  fontSize: 14,
                  cursor: "pointer",
                  outline: "none",
                  backgroundColor: pathname === "/provider" ? "#f5f5f5" : "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = pathname === "/provider" ? "#f5f5f5" : "transparent")
                }
              >
                <Menu size={16} color="#666" />
                Jobs
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href={"/provider/support" as any}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 4,
                  textDecoration: "none",
                  color: "#333",
                  fontSize: 14,
                  cursor: "pointer",
                  outline: "none",
                  backgroundColor: pathname === "/provider/support" ? "#f5f5f5" : "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    pathname === "/provider/support" ? "#f5f5f5" : "transparent")
                }
              >
                <LifeBuoy size={16} color="#666" />
                Support
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <HeaderThemeButton
        role="button"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        tabIndex={0}
        onPress={toggleTheme}
        onKeyDown={handleKeyToggleTheme}
      >
        {theme === "light" ? (
          <Moon size={20} color="white" />
        ) : (
          <Sun size={20} color="white" />
        )}
      </HeaderThemeButton>
    </XStack>
  )

  const rightContent = (
    <XStack alignItems="center" gap="$3">
      {!loading && (
        <StatusDotOuter available={isAvailable}>
          <StatusDotInner available={isAvailable} />
        </StatusDotOuter>
      )}

      <Link href="/provider/credits" style={{ textDecoration: "none" }}>
        <XStack
          alignItems="center"
          gap="$1.5"
          paddingVertical="$1"
          paddingHorizontal="$2"
          borderRadius="$2"
          backgroundColor="transparent"
          hoverStyle={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          cursor="pointer"
        >
          <Coins size={16} color="white" />
          <Paragraph fontSize="$3" fontWeight="600" color="white">
            {profile?.credits ?? 0}
          </Paragraph>
        </XStack>
      </Link>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <HeaderUserButton>
            <HeaderUserAvatar>
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 16 }}
                />
              ) : (
                <UserIcon size={18} color="$primary7" />
              )}
            </HeaderUserAvatar>
            <HeaderUserLabel>
              {profile?.name || "Account"}
            </HeaderUserLabel>
          </HeaderUserButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            style={{
              backgroundColor: "white",
              borderRadius: 8,
              padding: 4,
              minWidth: 160,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 1001,
            }}
          >
            <DropdownMenu.Item asChild>
              <Link
                href="/provider/profile"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 4,
                  textDecoration: "none",
                  color: "#333",
                  fontSize: 14,
                  cursor: "pointer",
                  outline: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <UserIcon size={16} color="#666" />
                Profile
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 4,
                color: "#333",
                fontSize: 14,
                cursor: "pointer",
                outline: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <LogOut size={16} color="#666" />
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </XStack>
  )

  return (
    <Header
      logoHref="/"
      leftContent={leftContent}
      rightContent={rightContent}
    />
  )
}
