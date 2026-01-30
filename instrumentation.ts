import { registerOTel } from "@vercel/otel"

// Suppress Tamagui font size resolution warnings during SSR compilation
// This is a known limitation when using custom size tokens (sm/lg) with fontFamily.
// The warnings occur during compilation but don't affect functionality.
const SUPPRESS_TAMAGUI_WARNINGS = process.env.SUPPRESS_TAMAGUI_WARNINGS === "true"
const originalWarn = console.warn
const originalError = console.error
const suppressTamaguiWarning = (...args: unknown[]): boolean => {
  // Fast path: check first argument (most warnings are string-first)
  const firstArg = args[0]
  if (typeof firstArg !== "string") return false

  const fullMessage = firstArg
  
  // Suppress if it contains "No font size found" and either "sm" or "lg"
  if (fullMessage.includes("No font size found") && 
      (fullMessage.includes('"sm"') || fullMessage.includes('"lg"') ||
       fullMessage.includes("'sm'") || fullMessage.includes("'lg'"))) {
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

console.warn = SUPPRESS_TAMAGUI_WARNINGS
  ? (...args: unknown[]) => {
      if (suppressTamaguiWarning(...args)) {
        return // Suppress known Tamagui SSR warnings (font size resolution + responsive prop/DOM warnings)
      }
      originalWarn.apply(console, args as Parameters<typeof console.warn>)
    }
  : originalWarn
console.error = SUPPRESS_TAMAGUI_WARNINGS
  ? (...args: unknown[]) => {
      if (suppressTamaguiWarning(...args)) {
        return // Suppress known Tamagui SSR warnings (font size resolution + responsive prop/DOM warnings)
      }
      originalError.apply(console, args as Parameters<typeof console.error>)
    }
  : originalError

export function register() {
  registerOTel("next-app")
}
