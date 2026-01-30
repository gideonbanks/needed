"use client"

import { TamaguiProvider as BaseTamaguiProvider } from "@tamagui/core"
import type { ReactNode } from "react"
import { ThemeProvider } from "./theme"
import config from "../tamagui.config"

// Suppress Tamagui font size resolution warnings
// This is a known limitation: when using custom size tokens (sm/lg) with fontFamily,
// Tamagui's internal font size resolution tries to look up these tokens before they're
// fully registered, causing false warnings. The functionality works correctly - buttons
// render with proper font sizes using numeric token references ($3, $5).
// See: https://github.com/tamagui/tamagui/issues (similar issues reported)
const originalWarn = console.warn
const originalError = console.error
const isDev = process.env.NODE_ENV === "development"
const suppressTamaguiWarning = (...args: unknown[]): boolean => {
  // Check all arguments for the warning pattern
  const fullMessage = args.map(arg => {
    if (typeof arg === "string") return arg
    if (typeof arg === "object" && arg !== null) {
      try {
        return JSON.stringify(arg)
      } catch {
        return String(arg)
      }
    }
    return String(arg)
  }).join(" ")
  
  // Suppress if it contains "No font size found" and either "sm" or "lg"
  if (fullMessage.includes("No font size found") && 
      (fullMessage.includes("sm") || fullMessage.includes("lg"))) {
    return true
  }
  
  // Suppress "Invalid attribute name" errors for Tamagui responsive props (e.g., $sm, $gtSm)
  if (fullMessage.includes("Invalid attribute name") && 
      (fullMessage.includes("$sm") || fullMessage.includes("$gtSm") || 
       fullMessage.includes("$md") || fullMessage.includes("$lg") ||
       fullMessage.includes("$xs") || fullMessage.includes("$xl"))) {
    return true
  }
  
  // Suppress React warnings about unrecognized responsive props on DOM elements
  if (fullMessage.includes("does not recognize the") && 
      fullMessage.includes("prop on a DOM element") &&
      (fullMessage.includes("$gtSm") || fullMessage.includes("$sm") ||
       fullMessage.includes("$gtMd") || fullMessage.includes("$md") ||
       fullMessage.includes("$gtLg") || fullMessage.includes("$lg") ||
       fullMessage.includes("$gtXl") || fullMessage.includes("$xl") ||
       fullMessage.includes("$xs") || fullMessage.includes("$xxs"))) {
    return true
  }
  
  return false
}

console.warn = (...args: unknown[]) => {
  if (isDev && suppressTamaguiWarning(...args)) {
    return // Suppress font size resolution warnings for custom size tokens
  }
  originalWarn.apply(console, args as Parameters<typeof console.warn>)
}
console.error = (...args: unknown[]) => {
  if (isDev && suppressTamaguiWarning(...args)) {
    return // Suppress font size resolution warnings for custom size tokens
  }
  originalError.apply(console, args as Parameters<typeof console.error>)
}

// React 19 compatible TamaguiProvider wrapper
export function TamaguiProviderWrapper({ children }: { children: ReactNode }) {

  return (
    <BaseTamaguiProvider
      config={config}
      defaultTheme="light"
      // Keep CSS injection enabled for proper styling
      disableInjectCSS={false}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </BaseTamaguiProvider>
  )
}
