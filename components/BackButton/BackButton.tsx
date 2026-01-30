"use client"

import { ArrowLeft } from "@tamagui/lucide-icons"
import type { Route } from "next"
import Link, { type LinkProps } from "next/link"
import { useRouter } from "next/navigation"
import type { KeyboardEvent } from "react"
import { styled, YStack } from "tamagui"

const BackButtonContainer = styled(YStack, {
  name: "BackButtonContainer",
  position: "absolute",
  top: "$4",
  left: "$4",
  width: 40,
  height: 40,
  borderRadius: "$2",
  backgroundColor: "$backgroundStrong", // Theme-aware background
  borderWidth: 1,
  borderColor: "$borderColor", // Theme-aware border
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 10,
  hoverStyle: {
    backgroundColor: "$backgroundHover", // Theme-aware hover
    borderColor: "$borderColorHover", // Theme-aware border hover
  },
  pressStyle: {
    backgroundColor: "$backgroundPress", // Theme-aware press
  },
})

interface BackButtonProps {
  href?: LinkProps<Route>["href"]
  onClick?: () => void
}

export function BackButton({ href, onClick }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (!href) {
      router.back()
    }
    // If href is provided, navigation is handled by Link component
  }

  // If href is provided, use Link for better accessibility (right-click, hover URL, etc.)
  if (href) {
    return (
      <Link
        href={href}
        onClick={
          onClick
            ? (e) => {
                e.preventDefault()
                onClick()
              }
            : undefined
        }
        aria-label="Go back"
        style={{ textDecoration: "none", display: "inline-block" }}
      >
        <BackButtonContainer>
          <ArrowLeft size={20} color="$color" />
        </BackButtonContainer>
      </Link>
    )
  }

  // Otherwise, use button behavior
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <BackButtonContainer
      onPress={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Go back"
      tabIndex={0}
    >
      <ArrowLeft size={20} color="$color" />
    </BackButtonContainer>
  )
}
