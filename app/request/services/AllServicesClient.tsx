"use client"

import { Check } from "@tamagui/lucide-icons"
import { useRouter, useSearchParams } from "next/navigation"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import { styled, Text, XStack, YStack } from "tamagui"
import { BackButton } from "components/BackButton/BackButton"
import { ContentContainer, PageContainer, Title } from "components/styled/request-flow"
import { readRequestDetailsFromSessionStorage, writeRequestDetailsToSessionStorage } from "lib/request/storage"

const ServiceGrid = styled(XStack, {
  name: "ServiceGrid",
  width: "100%",
  gap: "$3",
  flexWrap: "wrap",
  justifyContent: "flex-start",
})

const ServiceTile = styled(XStack, {
  name: "ServiceTile",
  flex: 1,
  width: "100%", // Mobile: 1 per row (100% width)
  // Desktop: 2 per row (handled by CSS)
  minWidth: 200, // Prevent tiles from becoming too narrow
  minHeight: 60,
  backgroundColor: "$backgroundStrong", // Theme-aware background (swapped in dark theme)
  borderRadius: "$3",
  padding: "$4",
  alignItems: "center",
  cursor: "pointer",
  borderWidth: 2,
  borderColor: "$borderColor", // Theme-aware border
  position: "relative",
  hoverStyle: {
    backgroundColor: "$backgroundHover", // Theme-aware hover (swapped in dark theme)
    borderColor: "$borderColorHover", // Theme-aware border hover
  },
})

const CheckIconContainer = styled(YStack, {
  name: "CheckIconContainer",
  position: "absolute",
  top: "50%",
  right: 8,
  width: 25,
  height: 25,
  borderRadius: 13,
  backgroundColor: "$accent6", // Accent color
  alignItems: "center",
  justifyContent: "center",
  transform: [{ translateY: -12.5 }],
  zIndex: 100,
  pointerEvents: "none",
})

const ServiceName = styled(Text, {
  name: "ServiceName",
  fontSize: "$5",
  fontWeight: "600",
  color: "$color", // Theme-aware text color
})

interface AllServicesClientProps {
  services: Array<{ id: string; slug: string; name: string }>
}

export function AllServicesClient({ services: initialServices }: AllServicesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlSelectedService = searchParams.get("service")
  const [selectedService, setSelectedService] = useState<string | null>(() => {
    return urlSelectedService ?? readRequestDetailsFromSessionStorage()?.service ?? null
  })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleServiceSelect = (serviceSlug: string) => {
    setSelectedService(serviceSlug)
    try {
      // Persist selection so it stays highlighted if user navigates back.
      // Clear time since we're choosing a (potentially new) service.
      writeRequestDetailsToSessionStorage({ service: serviceSlug, time: null })
    } catch {
      // Ignore storage access errors
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // Brief delay to show checkmark before navigating
    timeoutRef.current = setTimeout(() => {
      router.push(`/request/time?service=${serviceSlug}`)
    }, 200)
  }

  const handleKeyDown = (event: KeyboardEvent, serviceSlug: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleServiceSelect(serviceSlug)
    }
  }

  return (
    <PageContainer>
      <BackButton href="/request" />
      <ContentContainer maxWidth={800}>
        <Title>All Services</Title>

        {initialServices.length === 0 ? (
          <Text>No services available.</Text>
        ) : (
          <ServiceGrid>
            {initialServices.map((service) => {
              const isSelected = selectedService === service.slug
              return (
                <ServiceTile
                  key={service.id}
                  className="service-tile"
                  onPress={() => handleServiceSelect(service.slug)}
                  onKeyDown={(event: KeyboardEvent) =>
                    handleKeyDown(event, service.slug)
                  }
                  role="button"
                  tabIndex={0}
                >
                  <ServiceName>{service.name}</ServiceName>
                  {isSelected ? (
                    <CheckIconContainer>
                      <Check size={14} color="white" strokeWidth={3} />
                    </CheckIconContainer>
                  ) : null}
                </ServiceTile>
              )
            })}
          </ServiceGrid>
        )}
      </ContentContainer>
    </PageContainer>
  )
}
