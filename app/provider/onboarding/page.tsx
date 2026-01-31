"use client"

import { Check, MapPin, Briefcase, User } from "@tamagui/lucide-icons"
import { useRouter } from "next/navigation"
import {
  type ChangeEvent,
  type InputHTMLAttributes,
  useEffect,
  useState,
} from "react"
import { Paragraph, styled, XStack, YStack } from "tamagui"
import { Button } from "components/Button/Button"
import {
  LocationSearchInput,
  type LocationValue,
} from "components/LocationSearchInput/LocationSearchInput"
import {
  ContentContainer,
  Subtitle,
  Title,
} from "components/styled/request-flow"
import {
  ErrorMessage,
  FormField,
  Label,
  StyledInput,
} from "lib/provider/form-components"
import { createNamedStyle } from "lib/tamagui-utils"

interface Service {
  id: string
  name: string
  slug: string
}

interface Area {
  lat: number
  lng: number
  radiusKm: number
  displayName: string
}

type OnboardingStep = "name" | "services" | "areas"

const STEPS: OnboardingStep[] = ["name", "services", "areas"]

const ServiceChip = styled(XStack, {
  name: "ServiceChip",
  paddingVertical: "$2",
  paddingHorizontal: "$3",
  borderRadius: 999,
  borderWidth: 1,
  borderColor: "$borderColor",
  backgroundColor: "$background",
  alignItems: "center",
  gap: "$2",
  cursor: "pointer",
  hoverStyle: {
    borderColor: "$accent6",
  },
  variants: {
    selected: {
      true: {
        borderColor: "$accent6",
        backgroundColor: "$accent2",
      },
    },
  } as const,
})

const AreaCard = styled(XStack, {
  name: "AreaCard",
  width: "100%",
  padding: "$3",
  borderRadius: "$3",
  borderWidth: 1,
  borderColor: "$borderColor",
  backgroundColor: "$backgroundStrong",
  alignItems: "center",
  justifyContent: "space-between",
})

const StepIndicator = styled(YStack, {
  name: "StepIndicator",
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 2,
  variants: {
    status: {
      completed: {
        backgroundColor: "$accent6",
        borderColor: "$accent6",
      },
      current: {
        backgroundColor: "transparent",
        borderColor: "$accent6",
      },
      upcoming: {
        backgroundColor: "transparent",
        borderColor: "$gray6",
      },
    },
  } as const,
})

const StepLine = styled(YStack, {
  name: "StepLine",
  flex: 1,
  height: 2,
  marginHorizontal: "$2",
  variants: {
    completed: {
      true: {
        backgroundColor: "$accent6",
      },
      false: {
        backgroundColor: "$gray6",
      },
    },
  } as const,
})

const RadiusSlider = createNamedStyle("input", {
  name: "RadiusSlider",
  width: "100%",
  height: 8,
  cursor: "pointer",
  accentColor: "var(--accent6)",
}) as React.ComponentType<InputHTMLAttributes<HTMLInputElement>>

export default function ProviderOnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState<OnboardingStep>("name")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Step 1: Name
  const [name, setName] = useState("")
  const [businessName, setBusinessName] = useState("")

  // Step 2: Services
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [loadingServices, setLoadingServices] = useState(true)

  // Step 3: Areas
  const [locationSearch, setLocationSearch] = useState("")
  const [areas, setAreas] = useState<Area[]>([])
  const [pendingLocation, setPendingLocation] = useState<LocationValue | null>(null)
  const [pendingRadius, setPendingRadius] = useState(15)

  // Fetch services on mount
  useEffect(() => {
    fetch("/api/provider/services")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.services) {
          setServices(data.services)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingServices(false))
  }, [])

  const currentStepIndex = STEPS.indexOf(step)

  const getStepStatus = (s: OnboardingStep): "completed" | "current" | "upcoming" => {
    const stepIndex = STEPS.indexOf(s)
    if (stepIndex < currentStepIndex) return "completed"
    if (stepIndex === currentStepIndex) return "current"
    return "upcoming"
  }

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleLocationSelect = (location: LocationValue) => {
    setPendingLocation(location)
    setLocationSearch(location.displayName)
  }

  const addArea = () => {
    if (!pendingLocation) return

    setAreas((prev) => [
      ...prev,
      {
        lat: pendingLocation.lat,
        lng: pendingLocation.lng,
        radiusKm: pendingRadius,
        displayName: pendingLocation.displayName,
      },
    ])
    setPendingLocation(null)
    setLocationSearch("")
    setPendingRadius(15)
  }

  const removeArea = (index: number) => {
    setAreas((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    setError("")

    if (step === "name") {
      if (!name.trim()) {
        setError("Please enter your name")
        return
      }
      setStep("services")
    } else if (step === "services") {
      if (selectedServiceIds.length === 0) {
        setError("Please select at least one service")
        return
      }
      setStep("areas")
    }
  }

  const handleBack = () => {
    if (step === "services") {
      setStep("name")
    } else if (step === "areas") {
      setStep("services")
    }
  }

  const handleComplete = async () => {
    if (areas.length === 0) {
      setError("Please add at least one service area")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Update profile with all data
      const profileResponse = await fetch("/api/provider/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim() || undefined,
          serviceIds: selectedServiceIds,
          areas: areas.map((a) => ({
            lat: a.lat,
            lng: a.lng,
            radiusKm: a.radiusKm,
            displayName: a.displayName,
          })),
        }),
      })

      if (!profileResponse.ok) {
        const data = await profileResponse.json()
        throw new Error(data.error || "Failed to save profile")
      }

      // Complete onboarding (sets status to approved)
      const completeResponse = await fetch("/api/provider/auth/complete-onboarding", {
        method: "POST",
      })

      if (!completeResponse.ok) {
        const data = await completeResponse.json()
        throw new Error(data.error || "Failed to complete onboarding")
      }

      // Redirect to dashboard
      router.push("/provider")
    } catch (err) {
      console.error("Onboarding error:", err)
      setError(err instanceof Error ? err.message : "Failed to complete onboarding")
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$4"
      minHeight="100vh"
    >
      <ContentContainer>
        {/* Step Progress */}
        <XStack width="100%" alignItems="center" justifyContent="center" marginBottom="$4">
          {STEPS.map((s, i) => (
            <XStack key={s} alignItems="center" flex={i < STEPS.length - 1 ? 1 : undefined}>
              <StepIndicator status={getStepStatus(s)}>
                {getStepStatus(s) === "completed" ? (
                  <Check size={16} color="white" />
                ) : (
                  <Paragraph
                    fontSize="$3"
                    fontWeight="600"
                    color={getStepStatus(s) === "current" ? "$accent6" : "$gray8"}
                  >
                    {i + 1}
                  </Paragraph>
                )}
              </StepIndicator>
              {i < STEPS.length - 1 && (
                <StepLine completed={getStepStatus(STEPS[i + 1]!) !== "upcoming"} />
              )}
            </XStack>
          ))}
        </XStack>

        {/* Step Content */}
        {step === "name" && (
          <>
            <YStack alignItems="center" gap="$2">
              <User size={48} color="$accent6" />
              <Title>Welcome!</Title>
              <Subtitle>Let's set up your provider profile</Subtitle>
            </YStack>

            <FormField>
              <Label>Your name *</Label>
              <StyledInput
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                autoFocus
              />
            </FormField>

            <FormField>
              <Label>Business name (optional)</Label>
              <StyledInput
                type="text"
                placeholder="Smith's Plumbing"
                value={businessName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBusinessName(e.target.value)}
              />
            </FormField>

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}

            <Button onClick={handleNext} size="lg" width="100%">
              Continue
            </Button>
          </>
        )}

        {step === "services" && (
          <>
            <YStack alignItems="center" gap="$2">
              <Briefcase size={48} color="$accent6" />
              <Title>Your Services</Title>
              <Subtitle>Select all the services you offer</Subtitle>
            </YStack>

            {loadingServices ? (
              <Paragraph color="$colorSecondary">Loading services...</Paragraph>
            ) : (
              <XStack flexWrap="wrap" gap="$2" justifyContent="center">
                {services.map((service) => (
                  <ServiceChip
                    key={service.id}
                    selected={selectedServiceIds.includes(service.id)}
                    onPress={() => toggleService(service.id)}
                  >
                    {selectedServiceIds.includes(service.id) && (
                      <Check size={14} color="$accent6" />
                    )}
                    <Paragraph
                      fontSize="$3"
                      color={selectedServiceIds.includes(service.id) ? "$accent6" : "$color"}
                    >
                      {service.name}
                    </Paragraph>
                  </ServiceChip>
                ))}
              </XStack>
            )}

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}

            <XStack width="100%" gap="$3">
              <Button onClick={handleBack} intent="secondary" size="lg" flex={1}>
                Back
              </Button>
              <Button onClick={handleNext} size="lg" flex={1}>
                Continue
              </Button>
            </XStack>
          </>
        )}

        {step === "areas" && (
          <>
            <YStack alignItems="center" gap="$2">
              <MapPin size={48} color="$accent6" />
              <Title>Service Areas</Title>
              <Subtitle>Where do you work?</Subtitle>
            </YStack>

            <FormField>
              <Label>Add an area</Label>
              <LocationSearchInput
                value={locationSearch}
                onChange={setLocationSearch}
                onSelect={handleLocationSelect}
                placeholder="Search for a suburb..."
              />
            </FormField>

            {pendingLocation && (
              <YStack width="100%" gap="$3" padding="$3" borderRadius="$3" backgroundColor="$backgroundStrong">
                <XStack alignItems="center" justifyContent="space-between">
                  <Paragraph fontSize="$3" fontWeight="600">
                    {pendingLocation.displayName}
                  </Paragraph>
                  <Paragraph fontSize="$3" color="$colorSecondary">
                    {pendingRadius} km radius
                  </Paragraph>
                </XStack>
                <RadiusSlider
                  type="range"
                  min={5}
                  max={50}
                  value={pendingRadius}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPendingRadius(parseInt(e.target.value, 10))
                  }
                />
                <Button onClick={addArea} size="sm">
                  Add Area
                </Button>
              </YStack>
            )}

            {areas.length > 0 && (
              <YStack width="100%" gap="$2">
                <Label>Your service areas</Label>
                {areas.map((area, index) => (
                  <AreaCard key={index}>
                    <XStack alignItems="center" gap="$2">
                      <MapPin size={16} color="$accent6" />
                      <YStack>
                        <Paragraph fontSize="$3" fontWeight="500">
                          {area.displayName}
                        </Paragraph>
                        <Paragraph fontSize="$2" color="$colorSecondary">
                          {area.radiusKm} km radius
                        </Paragraph>
                      </YStack>
                    </XStack>
                    <Button
                      intent="secondary"
                      size="sm"
                      onClick={() => removeArea(index)}
                    >
                      Remove
                    </Button>
                  </AreaCard>
                ))}
              </YStack>
            )}

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}

            <XStack width="100%" gap="$3">
              <Button onClick={handleBack} intent="secondary" size="lg" flex={1}>
                Back
              </Button>
              <Button
                onClick={handleComplete}
                size="lg"
                flex={1}
                disabled={loading || areas.length === 0}
              >
                {loading ? "Saving..." : "Complete"}
              </Button>
            </XStack>
          </>
        )}
      </ContentContainer>
    </YStack>
  )
}
