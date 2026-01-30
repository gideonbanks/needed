import { config } from "@tamagui/config/v3"
import { createTamagui } from "@tamagui/core"

// Customize design tokens for Needed.co.nz
const appConfig = createTamagui({
  ...config,
  // Disable shorthands that might cause React 19 issues
  shorthands: {},
  tokens: {
    ...config.tokens,
    // Single source of truth for spacing: same values on web and mobile for design consistency
    space: {
      ...config.tokens.space,
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      7: 28,
      8: 32,
      9: 36,
      10: 40,
      11: 44,
      12: 48,
      13: 52,
      14: 56,
      15: 60,
      16: 64,
      17: 68,
      18: 70,
    },
    // Customize colors for your brand
    color: {
      ...config.tokens.color,
      // Needed.co.nz brand colors
      // Primary: #184153 (dark teal)
      primary1: "#f0f7f8",
      primary2: "#d1e6ea",
      primary3: "#a3cdd5",
      primary4: "#75b4c0",
      primary5: "#479bab",
      primary6: "#2d7a8a",
      primary7: "#184153", // Main primary color
      primary8: "#133a47",
      primary9: "#0e2d3b",
      primary10: "#09202f",
      primary11: "#041323",
      primary12: "#000617",
      // Accent: #01a493 (bright teal)
      accent1: "#e6faf8",
      accent2: "#b3f5f0",
      accent3: "#80f0e8",
      accent4: "#4debe0",
      accent5: "#1ae6d8",
      accent6: "#01a493", // Main accent color
      accent7: "#018377",
      accent8: "#01625b",
      accent9: "#01413f",
      accent10: "#002023",
      accent11: "#000f07",
      accent12: "#000000",
      // Override grey colors to ensure none are darker than #1f1f1f (gray9)
      // Replace any #171717 or darker greys with #1f1f1f
      gray1: "#fafafa", // Light grey (lighter than gray9)
      gray2: "#f5f5f5", // Light grey (lighter than gray9)
      gray3: "#eeeeee", // Light grey (lighter than gray9)
      gray4: "#e0e0e0", // Light grey (lighter than gray9)
      gray5: "#bdbdbd", // Medium grey (lighter than gray9)
      gray6: "#9e9e9e", // Medium grey (lighter than gray9)
      gray7: "#757575", // Medium-dark grey (lighter than gray9)
      gray8: "#616161", // Dark grey but lighter than gray9
      gray9: "#1f1f1f", // Darkest grey - no grey should be darker than this
      gray10: "#1f1f1f", // Capped to gray9 darkness
      gray11: "#1f1f1f", // Capped to gray9 darkness
      gray12: "#1f1f1f", // Capped to gray9 darkness
      // Custom color token for secondary text
      colorSecondary: "#616161", // Default to gray8, will be overridden in themes
      // Custom green color
      green: "#50dcaa", // Third green color for hover states
    },
    // Customize radius for big tap targets
    radius: {
      ...config.tokens.radius,
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
    },
    // Customize type scale
    size: {
      ...config.tokens.size,
      // Add custom size tokens for Button component variants
      // These map to existing size tokens but allow "sm" and "lg" to be used as size props
      sm: config.tokens.size["$3"], // Map "sm" to $3 token (36px)
      lg: config.tokens.size["$5"], // Map "lg" to $5 token (52px)
    },
  },
  fonts: {
    ...config.fonts,
    // Map custom size variants to numeric token keys that exist in tokens.size
    // This allows Tamagui to resolve font sizes when fontFamily="$body" is used
    body: {
      ...config.fonts.body,
      size: {
        ...config.fonts.body?.size,
        // Map to numeric token keys - Tamagui checks if these keys exist in tokens.size
        sm: config.tokens.size["$3"], // References tokens.size["$3"] (36px)
        lg: config.tokens.size["$5"], // References tokens.size["$5"] (52px)
      },
    },
  },
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      // Ensure light theme has proper border colors too
      borderColor: "#e5e5e5", // Light border for light mode
      borderColorHover: "#d4d4d4", // Slightly darker on hover
      backgroundStrong: "#ffffff", // White for cards in light mode
      backgroundHover: "#f5f5f5", // Grey 100 hover color for cards in light theme
      // Ensure all greys are properly set in light theme - gray9 is the darkest
      gray1: "#fafafa", // Light grey
      gray2: "#f5f5f5", // Light grey (grey 100)
      gray3: "#eeeeee", // Light grey
      gray4: "#e0e0e0", // Light grey
      gray5: "#bdbdbd", // Medium grey
      gray6: "#9e9e9e", // Medium grey
      gray7: "#757575", // Medium-dark grey
      gray8: "#616161", // Dark grey but lighter than gray9 - used for secondary text in light theme
      gray9: "#1f1f1f", // Darkest grey - no grey should be darker than this
      // Secondary text color for light theme
      colorSecondary: "#616161", // gray8 (#616161) for secondary text in light theme
    },
    dark: {
      ...config.themes.dark,
      background: "#1f1f1f", // Dark background
      backgroundPress: "#1a1a1a", // Slightly darker on press
      // Improve contrast for borders and surfaces
      borderColor: "#333742", // Border color for dark mode
      borderColorHover: "#3d4450", // Slightly lighter border on hover
      color: "#e8e9ea", // Light text color
      colorHover: "#ffffff", // White on hover
      // Surface colors for cards/tiles - SWAPPED for dark theme
      // In dark theme: backgroundStrong (card default) uses hover color, backgroundHover uses primary brand color
      backgroundStrong: "#2a2a2a", // Card default uses hover color (swapped) - was #25272e
      backgroundHover: "#184153", // Card hover uses primary brand color
      backgroundTransparent: "rgba(31, 31, 31, 0.8)", // For overlays
      // Grey colors for dark theme
      gray4: "#e0e0e0", // Light grey
      gray6: "#9e9e9e", // Medium grey for secondary text in dark theme
      // Secondary text color for dark theme - gray6
      colorSecondary: "#9e9e9e", // gray6 (#9e9e9e) for secondary text in dark theme
    },
    // Brand colors are available via $primary1-$primary12 and $accent1-$accent12 tokens
    // Main brand colors: $primary7 (#184153), $accent6 (#01a493)
  },
  media: {
    ...config.media,
    // Customize breakpoints if needed
  },
})

export default appConfig

export type Conf = typeof appConfig
