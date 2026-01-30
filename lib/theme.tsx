"use client"

import { Theme as TamaguiTheme } from "@tamagui/core"
import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem("theme")
      if (stored === "light" || stored === "dark") {
        setThemeState(stored)
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark")
      }
    } catch {
      // localStorage unavailable, use default theme
      if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark")
      }
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    // Update HTML class for CSS-based styling
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)

    // Store in localStorage
    try {
      localStorage.setItem("theme", theme)
    } catch {
      // localStorage unavailable (e.g., private browsing, quota exceeded)
    }
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <TamaguiTheme name={theme}>
        <div style={{ visibility: mounted ? "visible" : "hidden" }}>{children}</div>
      </TamaguiTheme>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
