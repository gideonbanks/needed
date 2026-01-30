"use client"

import { Moon, Sun } from "@tamagui/lucide-icons"
import { styled, YStack } from "tamagui"
import { useTheme } from "lib/theme"

const ToggleButton = styled(YStack, {
  name: "ToggleButton",
  width: 48,
  height: 48,
  borderRadius: "$6",
  backgroundColor: "$gray3",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  borderWidth: 1,
  borderColor: "$gray6",
  hoverStyle: {
    backgroundColor: "$gray4",
  },
  pressStyle: {
    backgroundColor: "$gray5",
  },
})

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <ToggleButton
      onPress={toggleTheme}
      role="button"
      tabIndex={0}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon size={20} color="$color" />
      ) : (
        <Sun size={20} color="$color" />
      )}
    </ToggleButton>
  )
}
