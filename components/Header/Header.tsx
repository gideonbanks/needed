"use client"

import { Menu, Moon, Sun, User } from "@tamagui/lucide-icons"
import Link from "next/link"
import type { CSSProperties, KeyboardEvent, ReactNode } from "react"
import { styled, Text, XStack, YStack } from "tamagui"
import { LogoImage } from "components/Logo/LogoImage"
import { useTheme } from "lib/theme"
import { handleKeyActivate, handleKeyClick } from "./keyboard"

export const HeaderContainer = styled(YStack, {
  name: "HeaderContainer",
  zIndex: 1000,
  width: "100%",
  paddingHorizontal: "$4",
  backgroundColor: "transparent",
  marginBottom: 10,
  paddingTop: 10,
  paddingBottom: 10,
})

export const HeaderBar = styled(XStack, {
  name: "HeaderBar",
  width: "100%",
  maxWidth: 1280,
  marginHorizontal: "auto",
  paddingHorizontal: "$5",
  paddingVertical: "$3",
  backgroundColor: "$primary7",
  borderRadius: "$4",
  alignItems: "center",
  minHeight: 56,
  "$sm": {
    paddingHorizontal: "$3",
    paddingVertical: "$2",
    minHeight: 48,
  },
})

export const HeaderLeftGroup = styled(XStack, {
  name: "HeaderLeftGroup",
  alignItems: "center",
  gap: "$4",
  flex: 1,
})

export const HeaderRightGroup = styled(XStack, {
  name: "HeaderRightGroup",
  alignItems: "center",
  gap: 5,
  flex: 1,
  justifyContent: "flex-end",
})

export const HeaderMenuButton = styled(YStack, {
  name: "HeaderMenuButton",
  width: 40,
  height: 40,
  borderRadius: "$6",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  hoverStyle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
})

export const HeaderLogoGroup = styled(XStack, {
  name: "HeaderLogoGroup",
  alignItems: "center",
  gap: "$3",
  cursor: "pointer",
  transform: "scale(1.1)",
  hoverStyle: {
    transform: "scale(1.21)",
  },
  transition: "transform 0.2s ease",
})

export const HeaderThemeButton = styled(YStack, {
  name: "HeaderThemeButton",
  width: 40,
  height: 40,
  borderRadius: "$6",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  hoverStyle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
})

export const HeaderUserButton = styled(XStack, {
  name: "HeaderUserButton",
  alignItems: "center",
  gap: "$2",
  cursor: "pointer",
  paddingVertical: "$1",
  paddingLeft: "$1",
  paddingRight: 15,
  borderRadius: "$6",
  "$sm": {
    paddingHorizontal: "$1",
  },
  hoverStyle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
})

export const HeaderUserAvatar = styled(YStack, {
  name: "HeaderUserAvatar",
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: "white",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
})

export const HeaderUserLabel = styled(Text, {
  name: "HeaderUserLabel",
  fontSize: "$4",
  fontWeight: "500",
  color: "white",
  "$sm": {
    display: "none",
  },
})

const LOGO_LINK_STYLE: CSSProperties = { display: "flex", alignItems: "center" }
const LOGO_IMAGE_STYLE: CSSProperties = { height: "32px", width: "auto" }
const HEADER_BAR_LAYOUT_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
}

interface HeaderProps {
  leftContent?: ReactNode
  rightContent?: ReactNode
  logoHref?: string
  sticky?: boolean
  showHeader?: boolean
}

export function Header({
  leftContent,
  rightContent,
  logoHref = "/",
  sticky = false,
  showHeader = true,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  const handleKeyToggleTheme = (event: KeyboardEvent<HTMLElement>) => {
    handleKeyActivate(event, toggleTheme)
  }

  const containerStyle: CSSProperties = sticky
    ? { position: "sticky", top: 10 }
    : {}

  const headerStyle: CSSProperties = {
    transform: showHeader ? "translateY(0)" : "translateY(-120%)",
    opacity: showHeader ? 1 : 0,
    transition: "transform 0.10s ease, opacity 0.10s ease",
    pointerEvents: showHeader ? "auto" : "none",
  }

  const defaultLeftContent = (
    <XStack gap={5} alignItems="center">
      <HeaderMenuButton
        role="button"
        aria-label="Open menu"
        tabIndex={0}
        onKeyDown={handleKeyClick}
      >
        <Menu size={20} color="white" />
      </HeaderMenuButton>
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

  const defaultRightContent = (
    <>
      <HeaderUserButton
        role="button"
        aria-label="Sign in"
        tabIndex={0}
        onKeyDown={handleKeyClick}
      >
        <HeaderUserAvatar>
          <User size={18} color="$primary7" />
        </HeaderUserAvatar>
        <HeaderUserLabel>Sign in</HeaderUserLabel>
      </HeaderUserButton>
    </>
  )

  return (
    <HeaderContainer style={containerStyle}>
      <HeaderBar
        id="header-bar"
        style={{ ...HEADER_BAR_LAYOUT_STYLE, ...headerStyle }}
      >
        <HeaderLeftGroup>
          {leftContent ?? defaultLeftContent}
        </HeaderLeftGroup>
        <HeaderLogoGroup>
          <Link href={logoHref as any} style={LOGO_LINK_STYLE}>
            <LogoImage variant="dark" style={LOGO_IMAGE_STYLE} />
          </Link>
        </HeaderLogoGroup>
        <HeaderRightGroup>
          {rightContent ?? defaultRightContent}
        </HeaderRightGroup>
      </HeaderBar>
    </HeaderContainer>
  )
}
