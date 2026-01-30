"use client"

import { Check } from "@tamagui/lucide-icons"
import { useRouter, useSearchParams } from "next/navigation"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import { styled, Text, XStack, YStack } from "tamagui"
import { BackButton } from "components/BackButton/BackButton"
import { ContentContainer, PageContainer, Title } from "components/styled/request-flow"

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
  borderWidth: 1,
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
  top: 8,
  right: 8,
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: "$accent6", // Accent color
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  pointerEvents: "none",
  borderWidth: 2,
  borderColor: "white",
  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
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
  const [selectedService, setSelectedService] = useState<string | null>(urlSelectedService)
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
                      <Check size={16} color="white" strokeWidth={3} />
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
