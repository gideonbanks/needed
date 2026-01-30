"use client"

import { Check } from "@tamagui/lucide-icons"
import { useRouter, useSearchParams } from "next/navigation"
import { type KeyboardEvent, Suspense, useEffect, useRef, useState } from "react"
import { Paragraph, styled, XStack, YStack } from "tamagui"
import {
  ContentContainer,
  Subtitle,
  Title,
} from "components/styled/request-flow"
import { readRequestDetailsFromSessionStorage, writeRequestDetailsToSessionStorage } from "lib/request/storage"

const ServiceGrid = styled(XStack, {
  name: "ServiceGrid",
  width: "100%",
  gap: "$3",
  flexWrap: "wrap",
  justifyContent: "flex-start", // Start from left for 2-column layout
})

const ServiceTile = styled(YStack, {
  name: "ServiceTile",
  flex: 1,
  // Desktop: original sizing (flex: 1, minWidth: 150, maxWidth: 180)
  minWidth: 150,
  maxWidth: 180,
  // Mobile: 2 cards per row (overridden by CSS)
  width: "auto", // Default to auto, CSS will handle mobile
  // Uniform height for all cards
  minHeight: 120,
  aspectRatio: undefined, // Remove aspect ratio for uniform sizing
  backgroundColor: "$backgroundStrong", // Theme-aware background (swapped in dark theme)
  borderRadius: "$4",
  padding: "$4",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  borderWidth: 2,
  borderColor: "$borderColor", // Theme-aware border
  position: "relative",
  hoverStyle: {
    backgroundColor: "$backgroundHover", // Theme-aware hover (swapped in dark theme)
    borderColor: "$borderColorHover", // Theme-aware border hover
  },
  pressStyle: {
    backgroundColor: "$backgroundPress", // Theme-aware press
  },
})

const ServiceTileSelected = styled(ServiceTile, {
  name: "ServiceTileSelected",
  backgroundColor: "$backgroundStrong", // Theme-aware background
  borderColor: "$accent6", // Accent color border when selected
  hoverStyle: {
    backgroundColor: "$backgroundHover", // Theme-aware hover
    borderColor: "$accent6", // Keep accent border on hover
  },
})

const ServiceName = styled(Paragraph, {
  name: "ServiceName",
  fontSize: "$5",
  fontWeight: "600",
  color: "$color", // Theme-aware text color
  textAlign: "center",
  marginTop: "$2",
  // Allow text to break into 2 lines
  lineHeight: "$5",
  flexWrap: "wrap", // Allow text wrapping
  maxWidth: "100%", // Ensure text doesn't overflow card
})

const ServiceNameSelected = styled(ServiceName, {
  name: "ServiceNameSelected",
  color: "$accent6", // Accent color for selected state
  // Ensure color stays accent even on parent hover
  hoverStyle: {
    color: "$accent6",
  },
})

const CheckIconContainer = styled(YStack, {
  name: "CheckIconContainer",
  position: "absolute",
  top: "$2",
  right: "$2",
  width: 25,
  height: 25,
  borderRadius: "$10",
  backgroundColor: "$accent6", // Accent color
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  pointerEvents: "none",
})

const Footer = styled(Paragraph, {
  name: "Footer",
  fontSize: "$2",
  color: "$colorSecondary", // gray8 in light theme, white in dark theme
  textAlign: "center",
  marginTop: "$8",
})

// Top 6 services from NEEDED.md
const TOP_SERVICES = [
  { slug: "plumber", name: "Plumber" },
  { slug: "electrician", name: "Electrician" },
  { slug: "handyman", name: "Handyman" },
  { slug: "movers", name: "Movers" },
  { slug: "house-cleaning", name: "House cleaners" },
  { slug: "all-services", name: "See all services" },
]

function RequestServiceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlService = searchParams.get("service")
  const [selectedService, setSelectedService] = useState<string | null>(
    urlService || null
  )
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    // If the URL doesn't specify a service (common when navigating back),
    // hydrate from the persisted draft so the prior selection stays highlighted.
    if (!urlService && !hasHydratedRef.current) {
      hasHydratedRef.current = true
      const stored = readRequestDetailsFromSessionStorage()
      if (stored?.service) {
        setSelectedService(stored.service)
      }
    }
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current)
      }
    }
  }, [urlService])

  const handleServiceSelect = (serviceSlug: string) => {
    if (serviceSlug === "all-services") {
      router.push("/request/services")
      return
    }
    setSelectedService(serviceSlug)
    // Persist selection so it stays highlighted if the user navigates back.
    // Clear time if they change service.
    try {
      const stored = readRequestDetailsFromSessionStorage()
      const previousService = stored?.service ?? null
      writeRequestDetailsToSessionStorage({
        service: serviceSlug,
        time: previousService && previousService !== serviceSlug ? null : stored?.time ?? null,
      })
    } catch {
      // Ignore storage access errors
    }
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current)
    }
    // Brief delay for visual feedback before navigating
    navTimeoutRef.current = setTimeout(() => {
      router.push(`/request/time?service=${serviceSlug}`)
    }, 150)
  }

  return (
    <ContentContainer>
        <Title color="$color">What do you need?</Title>
        <Subtitle marginBottom="$6">
          We'll send your request to up to 3 available pros.
        </Subtitle>

        <ServiceGrid>
          {TOP_SERVICES.map((service) => {
            const isSelected = selectedService === service.slug
            const Tile = isSelected ? ServiceTileSelected : ServiceTile
            const Name = isSelected ? ServiceNameSelected : ServiceName

            return (
              <Tile
                key={service.slug}
                onPress={() => handleServiceSelect(service.slug)}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleServiceSelect(service.slug)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {isSelected ? (
                  <CheckIconContainer>
                    <Check size={14} color="white" strokeWidth={3} />
                  </CheckIconContainer>
                ) : null}
                <Name>{service.name}</Name>
              </Tile>
            )
          })}
        </ServiceGrid>

        <Footer>No account required.</Footer>
    </ContentContainer>
  )
}

export default function RequestServicePage() {
  return (
    <Suspense fallback={<Paragraph>Loading...</Paragraph>}>
      <RequestServiceContent />
    </Suspense>
  )
}
