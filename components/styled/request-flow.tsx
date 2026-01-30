"use client"

import { H1, Paragraph, styled, YStack } from "tamagui"

// Styled components
export const PageContainer = styled(YStack, {
  name: "PageContainer",
  minHeight: "100dvh", // Dynamic viewport height - handles mobile address bar
  backgroundColor: "$background",
  padding: "$4",
  alignItems: "center",
  justifyContent: "center",
  overflow: "visible", // Only scroll when content actually exceeds viewport
})

export const ContentContainer = styled(YStack, {
  name: "ContentContainer",
  maxWidth: 600,
  width: "100%",
  gap: "$6",
  alignItems: "center",
})

export const Title = styled(H1, {
  name: "Title",
  fontSize: "$9",
  fontWeight: "800",
  textAlign: "center",
  marginBottom: "$2",
})

export const Subtitle = styled(Paragraph, {
  name: "Subtitle",
  fontSize: "$5",
  color: "$colorSecondary", // gray8 in light theme, white in dark theme
  textAlign: "center",
})

export const ThemeToggleContainer = styled(YStack, {
  name: "ThemeToggleContainer",
  position: "absolute",
  top: "$4",
  right: "$4",
  zIndex: 10,
})
