"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

interface AvailabilityContextValue {
  isAvailable: boolean
  loading: boolean
  toggleAvailability: () => Promise<void>
}

const AvailabilityContext = createContext<AvailabilityContextValue | null>(null)

export function AvailabilityProvider({ children }: { children: ReactNode }) {
  const [isAvailable, setIsAvailable] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/provider/availability")
      .then((res) => res.json())
      .then((data) => {
        if (data.isAvailable !== undefined) {
          setIsAvailable(data.isAvailable)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggleAvailability = useCallback(async () => {
    const newValue = !isAvailable
    setIsAvailable(newValue)

    try {
      const res = await fetch("/api/provider/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newValue }),
      })

      if (!res.ok) {
        setIsAvailable(!newValue)
      }
    } catch {
      setIsAvailable(!newValue)
    }
  }, [isAvailable])

  return (
    <AvailabilityContext.Provider value={{ isAvailable, loading, toggleAvailability }}>
      {children}
    </AvailabilityContext.Provider>
  )
}

export function useAvailability() {
  const context = useContext(AvailabilityContext)
  if (!context) {
    throw new Error("useAvailability must be used within AvailabilityProvider")
  }
  return context
}
