"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { type KeyboardEvent, Suspense, useEffect, useRef, useState } from "react"
import { Paragraph, styled, YStack } from "tamagui"
import { BackButton } from "components/BackButton/BackButton"
import {
  ContentContainer,
  Title,
} from "components/styled/request-flow"
import { readRequestDetailsFromSessionStorage, writeRequestDetailsToSessionStorage } from "lib/request/storage"

const TimeOption = styled(YStack, {
  name: "TimeOption",
  width: "100%",
  minHeight: 80,
  backgroundColor: "$backgroundStrong", // Theme-aware background
  borderRadius: "$4",
  padding: "$6",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  borderWidth: 2,
  borderColor: "$borderColor", // Theme-aware border
  hoverStyle: {
    backgroundColor: "$backgroundHover", // Theme-aware hover
    borderColor: "$borderColorHover", // Theme-aware border hover
  },
  pressStyle: {
    backgroundColor: "$backgroundPress", // Theme-aware press
  },
})

const TimeOptionSelected = styled(TimeOption, {
  name: "TimeOptionSelected",
  backgroundColor: "$backgroundStrong", // Theme-aware background
  borderColor: "$accent6", // Accent color border
  hoverStyle: {
    backgroundColor: "$backgroundHover", // Theme-aware hover
    borderColor: "$accent6", // Keep accent border on hover
  },
})

const TimeOptionText = styled(Paragraph, {
  name: "TimeOptionText",
  fontSize: "$6",
  fontWeight: "600",
  color: "$color", // Theme-aware text color
})

const TimeOptionTextSelected = styled(TimeOptionText, {
  name: "TimeOptionTextSelected",
  color: "$accent6", // Accent color for selected
  // Ensure color stays accent even on parent hover
  hoverStyle: {
    color: "$accent6",
  },
})

const Footer = styled(Paragraph, {
  name: "Footer",
  fontSize: "$2",
  color: "$colorSecondary", // gray8 in light theme, white in dark theme
  textAlign: "center",
  marginTop: "$8",
})

const TIME_OPTIONS = [
  { value: "now", label: "Now" },
  { value: "today", label: "Today" },
  { value: "this-week", label: "This week" },
]

function RequestTimeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const service = searchParams.get("service")
  const urlTime = searchParams.get("time")
  const [selectedTime, setSelectedTime] = useState<string | null>(
    urlTime || null
  )
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!service) {
      // If user navigates back here without the URL param, restore from draft.
      const stored = readRequestDetailsFromSessionStorage()
      if (stored?.service) {
        router.replace(`/request/time?service=${encodeURIComponent(stored.service)}`)
        return
      }
      router.replace("/request")
      return
    }

    // If no time in URL, hydrate from draft (but only if it matches the same service).
    if (!urlTime && !hasHydratedRef.current) {
      hasHydratedRef.current = true
      const stored = readRequestDetailsFromSessionStorage()
      if (stored?.service === service && stored?.time) {
        setSelectedTime(stored.time)
      }
    }
  }, [service, router, urlTime])

  if (!service) {
    return null
  }

  const handleTimeSelect = (timeValue: string) => {
    setSelectedTime(timeValue)
    // Persist selection so it stays highlighted if the user navigates back.
    try {
      writeRequestDetailsToSessionStorage({ service, time: timeValue })
    } catch {
      // Ignore storage access errors
    }
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current)
    }
    // Navigate to details
    navTimeoutRef.current = setTimeout(() => {
      router.push(
        `/request/details?service=${encodeURIComponent(service)}&time=${encodeURIComponent(timeValue)}`
      )
    }, 150)
  }

  return (
    <>
      <BackButton href="/request" />
      <ContentContainer>
        <Title>When do you need it?</Title>

        <YStack width="100%" gap="$3">
          {TIME_OPTIONS.map((option) => {
            const isSelected = selectedTime === option.value
            const Option = isSelected ? TimeOptionSelected : TimeOption
            const Text = isSelected ? TimeOptionTextSelected : TimeOptionText

            return (
              <Option
                key={option.value}
                onPress={() => handleTimeSelect(option.value)}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleTimeSelect(option.value)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <Text>{option.label}</Text>
              </Option>
            )
          })}
        </YStack>

        {selectedTime === "now" && (
          <Footer>For "Now", we only notify pros who are available.</Footer>
        )}
      </ContentContainer>
    </>
  )
}

export default function RequestTimePage() {
  return (
    <Suspense fallback={<Paragraph>Loading...</Paragraph>}>
      <RequestTimeContent />
    </Suspense>
  )
}
