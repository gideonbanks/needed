"use client"

import { useEffect, useState, useRef, type ChangeEvent } from "react"
import { Paragraph, styled, XStack, YStack } from "tamagui"
import { MapPin, Check, Plus, X, Camera, User } from "@tamagui/lucide-icons"
import { Button } from "components/Button/Button"
import {
  DashboardContent,
  ToggleSwitchTrack,
  ToggleSwitchKnob,
} from "components/styled/provider-dashboard"
import { useAvailability } from "lib/provider/availability-context"
import { StyledInput } from "lib/provider/form-components"
import { createNamedStyle } from "lib/tamagui-utils"
import { LocationSearchInput, type LocationValue } from "components/LocationSearchInput/LocationSearchInput"

type ProviderMeResponse =
  | (ProviderProfile & { error?: undefined })
  | { error: string }

type ProviderServicesResponse =
  | { services: AvailableService[] }
  | { error?: string }

type ProviderAvatarResponse =
  | { avatarUrl: string }
  | { error?: string }

type ProviderMePatchBody = {
  name?: string
  businessName?: string
  serviceIds?: string[]
  areas?: Array<{ lat: number; lng: number; radiusKm: number; displayName?: string }>
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  return (await res.json()) as T
}

async function patchProviderMe(body: ProviderMePatchBody) {
  return await fetch("/api/provider/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function fetchProviderServices(): Promise<ProviderServicesResponse> {
  return await fetchJson<ProviderServicesResponse>("/api/provider/services")
}

async function fetchProviderMe(): Promise<ProviderMeResponse> {
  return await fetchJson<ProviderMeResponse>("/api/provider/me")
}

async function uploadProviderAvatar(file: File) {
  const formData = new FormData()
  formData.append("file", file)
  return await fetch("/api/provider/avatar", { method: "POST", body: formData })
}

async function withSavingFlag(
  setSaving: (value: boolean) => void,
  fn: () => Promise<void>,
  onError: (error: unknown) => void
) {
  setSaving(true)
  try {
    await fn()
  } catch (error) {
    onError(error)
  } finally {
    setSaving(false)
  }
}

const ProfileCard = styled(YStack, {
  name: "ProfileCard",
  padding: "$4",
  backgroundColor: "$backgroundStrong",
  borderRadius: "$3",
  borderWidth: 1,
  borderColor: "$borderColor",
  gap: "$3",
})

const Label = styled(Paragraph, {
  name: "Label",
  fontSize: "$3",
  color: "$colorSecondary",
  fontWeight: "500",
})

const ServiceChip = styled(XStack, {
  name: "ServiceChip",
  paddingHorizontal: "$3",
  paddingVertical: "$2",
  backgroundColor: "$accent6",
  borderRadius: "$2",
  alignItems: "center",
  gap: "$1",
})

const SelectableServiceChip = styled(XStack, {
  name: "SelectableServiceChip",
  paddingHorizontal: "$3",
  paddingVertical: "$2",
  borderRadius: "$2",
  alignItems: "center",
  gap: "$2",
  cursor: "pointer",
  borderWidth: 1,
  variants: {
    selected: {
      true: {
        backgroundColor: "$accent6",
        borderColor: "$accent6",
      },
      false: {
        backgroundColor: "$background",
        borderColor: "$borderColor",
      },
    },
  } as const,
  defaultVariants: {
    selected: false,
  },
  hoverStyle: {
    opacity: 0.8,
  },
  pressStyle: {
    opacity: 0.7,
  },
})

const AreaChip = styled(XStack, {
  name: "AreaChip",
  paddingHorizontal: "$3",
  paddingVertical: "$2",
  backgroundColor: "$backgroundStrong",
  borderRadius: "$2",
  borderWidth: 1,
  borderColor: "$borderColor",
  alignItems: "center",
  gap: "$2",
})

const SmallInput = createNamedStyle("input", {
  name: "SmallInput",
  minHeight: 40,
  fontSize: "$3",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$2",
  paddingHorizontal: "$3",
  backgroundColor: "$background",
  fontFamily: "$body",
  outline: "none",
  focusStyle: {
    borderColor: "$accent6",
    borderWidth: 2,
  },
})

const AreaRow = styled(XStack, {
  name: "AreaRow",
  gap: "$2",
  alignItems: "center",
  padding: "$2",
  backgroundColor: "$background",
  borderRadius: "$2",
  borderWidth: 1,
  borderColor: "$borderColor",
})

const RemoveButton = styled(YStack, {
  name: "RemoveButton",
  width: 32,
  height: 32,
  borderRadius: "$2",
  backgroundColor: "$red3",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  hoverStyle: {
    backgroundColor: "$red4",
  },
  pressStyle: {
    backgroundColor: "$red5",
  },
})

const StatusBadge = styled(XStack, {
  name: "StatusBadge",
  paddingHorizontal: "$3",
  paddingVertical: "$1",
  borderRadius: 9999,
  alignItems: "center",
  gap: "$1",
  variants: {
    status: {
      approved: {
        backgroundColor: "$green3",
      },
      pending: {
        backgroundColor: "$yellow3",
      },
      suspended: {
        backgroundColor: "$red3",
      },
    },
  } as const,
})

const AvatarContainer = styled(YStack, {
  name: "AvatarContainer",
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: "$backgroundStrong",
  borderWidth: 2,
  borderColor: "$borderColor",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  position: "relative",
})

const AvatarOverlay = styled(YStack, {
  name: "AvatarOverlay",
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: 32,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
})

interface ProviderProfile {
  id: string
  phone: string
  name: string | null
  avatarUrl: string | null
  businessName: string | null
  status: "pending" | "approved" | "suspended"
  createdAt: string
  services: Array<{ id: string; name: string; slug: string }>
  areas: Array<{ id: string; lat: number; lng: number; radiusKm: number; displayName: string | null }>
}

interface AvailableService {
  id: string
  name: string
  slug: string
}

interface EditableArea {
  searchValue: string
  displayName: string
  lat: number | null
  lng: number | null
  radiusKm: string
}

function getFirstName(name: string | null) {
  return (name ?? "").trim().split(/\s+/)[0] ?? ""
}

function toEditableAreas(profileAreas: ProviderProfile["areas"]): EditableArea[] {
  const areas = profileAreas.map((area) => ({
    searchValue: "",
    displayName: area.displayName || `${area.lat.toFixed(4)}, ${area.lng.toFixed(4)}`,
    lat: area.lat,
    lng: area.lng,
    radiusKm: area.radiusKm.toString(),
  }))
  return areas.length > 0
    ? areas
    : [{ searchValue: "", displayName: "", lat: null, lng: null, radiusKm: "10" }]
}

function updateAreaAtIndex(
  areas: EditableArea[],
  index: number,
  updater: (area: EditableArea) => EditableArea
) {
  return areas.map((area, i) => (i === index ? updater(area) : area))
}

export default function ProviderProfilePage() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [editingServices, setEditingServices] = useState(false)
  const [allServices, setAllServices] = useState<AvailableService[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set())
  const [savingServices, setSavingServices] = useState(false)
  const [editingAreas, setEditingAreas] = useState(false)
  const [editableAreas, setEditableAreas] = useState<EditableArea[]>([])
  const [savingAreas, setSavingAreas] = useState(false)
  const { isAvailable, loading: availabilityLoading, toggleAvailability } = useAvailability()

  useEffect(() => {
    fetchProviderMe()
      .then((data) => {
        if ("error" in data && data.error) return
        const profileData = data as ProviderProfile
        setProfile(profileData)
        setName(profileData.name || "")
        setBusinessName(profileData.businessName || "")
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!profile) return

    await withSavingFlag(
      setSaving,
      async () => {
        const res = await patchProviderMe({ name, businessName })
        if (res.ok) {
          setProfile({ ...profile, name, businessName })
          setEditing(false)
        }
      },
      (error) => console.error("Failed to save profile:", error)
    )
  }

  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingAvatar(true)
    try {
      const res = await uploadProviderAvatar(file)
      if (res.ok) {
        const data = (await res.json()) as ProviderAvatarResponse
        if (data && typeof (data as any).avatarUrl === "string") {
          setProfile({ ...profile, avatarUrl: (data as any).avatarUrl })
        }
      } else {
        const error = (await res.json()) as ProviderAvatarResponse
        console.error("Avatar upload failed:", (error as any).error)
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error)
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ""
      }
    }
  }

  const handleEditServices = async () => {
    if (allServices.length === 0) {
      try {
        const data = await fetchProviderServices()
        if ("services" in data && Array.isArray(data.services)) {
          setAllServices(data.services)
        }
      } catch (error) {
        console.error("Failed to fetch services:", error)
        return
      }
    }
    setSelectedServiceIds(new Set(profile?.services.map((s) => s.id) || []))
    setEditingServices(true)
  }

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev)
      if (next.has(serviceId)) {
        next.delete(serviceId)
      } else {
        next.add(serviceId)
      }
      return next
    })
  }

  const handleSaveServices = async () => {
    if (!profile) return

    await withSavingFlag(
      setSavingServices,
      async () => {
        const res = await patchProviderMe({ serviceIds: Array.from(selectedServiceIds) })
        if (res.ok) {
          const updatedServices = allServices.filter((s) => selectedServiceIds.has(s.id))
          setProfile({ ...profile, services: updatedServices })
          setEditingServices(false)
        }
      },
      (error) => console.error("Failed to save services:", error)
    )
  }

  const handleEditAreas = () => {
    setEditableAreas(toEditableAreas(profile?.areas ?? []))
    setEditingAreas(true)
  }

  const handleAddArea = () => {
    setEditableAreas([...editableAreas, { searchValue: "", displayName: "", lat: null, lng: null, radiusKm: "10" }])
  }

  const handleRemoveArea = (index: number) => {
    setEditableAreas(editableAreas.filter((_, i) => i !== index))
  }

  const handleAreaSearchChange = (index: number, value: string) => {
    setEditableAreas(updateAreaAtIndex(editableAreas, index, (area) => ({
      ...area,
      searchValue: value,
      lat: null,
      lng: null,
      displayName: "",
    })))
  }

  const handleAreaSelect = (index: number, location: LocationValue) => {
    setEditableAreas(updateAreaAtIndex(editableAreas, index, (area) => ({
      ...area,
      searchValue: location.displayName,
      displayName: location.displayName,
      lat: location.lat,
      lng: location.lng,
    })))
  }

  const handleAreaRadiusChange = (index: number, value: string) => {
    setEditableAreas(updateAreaAtIndex(editableAreas, index, (area) => ({
      ...area,
      radiusKm: value,
    })))
  }

  const handleSaveAreas = async () => {
    if (!profile) return

    const validEditableAreas = editableAreas.filter(
      (area) => area.lat !== null && area.lng !== null && area.radiusKm && !isNaN(parseFloat(area.radiusKm))
    )

    const areasToSave = validEditableAreas.map((area) => ({
      lat: area.lat as number,
      lng: area.lng as number,
      radiusKm: parseFloat(area.radiusKm),
      displayName: area.displayName || undefined,
    }))

    await withSavingFlag(
      setSavingAreas,
      async () => {
        const res = await patchProviderMe({ areas: areasToSave })
        if (res.ok) {
          const updatedAreas = validEditableAreas.map((area, i) => ({
            id: `temp-${i}`,
            lat: area.lat as number,
            lng: area.lng as number,
            radiusKm: parseFloat(area.radiusKm),
            displayName: area.displayName || null,
          }))
          setProfile({ ...profile, areas: updatedAreas })
          setEditingAreas(false)
        }
      },
      (error) => console.error("Failed to save areas:", error)
    )
  }

  if (loading) {
    return (
      <DashboardContent>
        <Paragraph>Loading...</Paragraph>
      </DashboardContent>
    )
  }

  if (!profile) {
    return (
      <DashboardContent>
        <Paragraph>Failed to load profile</Paragraph>
      </DashboardContent>
    )
  }

  const firstName = getFirstName(profile.name)

  return (
    <DashboardContent>
      <XStack justifyContent="space-between" alignItems="center">
        <Paragraph fontSize="$6" fontWeight="600">
          {firstName ? `Hi ${firstName}!` : "Hi!"}
        </Paragraph>
        <StatusBadge status={profile.status}>
          {profile.status === "approved" && (
            <YStack
              width={16}
              height={16}
              borderRadius={8}
              backgroundColor="$green9"
              alignItems="center"
              justifyContent="center"
            >
              <Check size={10} color="white" />
            </YStack>
          )}
          <Paragraph
            fontSize="$3"
            fontWeight="500"
            color={
              profile.status === "approved"
                ? "$green9"
                : profile.status === "pending"
                ? "$yellow9"
                : "$red9"
            }
          >
            {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
          </Paragraph>
        </StatusBadge>
      </XStack>

      <ProfileCard>
        <XStack justifyContent="space-between" alignItems="flex-start">
          <XStack alignItems="center" gap="$4" flex={1}>
            <YStack position="relative">
              <AvatarContainer>
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Profile avatar"
                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 50 }}
                  />
                ) : (
                  <User size={48} color="$colorSecondary" />
                )}
                <AvatarOverlay onPress={handleAvatarClick}>
                  {uploadingAvatar ? (
                    <Paragraph fontSize="$2" color="white">...</Paragraph>
                  ) : (
                    <Camera size={16} color="white" />
                  )}
                </AvatarOverlay>
              </AvatarContainer>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </YStack>
            <YStack gap="$1" flex={1}>
              {editing ? (
                <YStack gap="$3">
                  <YStack gap="$1">
                    <Label>Your Name</Label>
                    <StyledInput
                      value={name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </YStack>
                  <YStack gap="$1">
                    <Label>Business Name</Label>
                    <StyledInput
                      value={businessName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setBusinessName(e.target.value)}
                      placeholder="Your business name"
                    />
                  </YStack>
                  <XStack gap="$2">
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      intent="secondary"
                      size="sm"
                      onClick={() => {
                        setName(profile.name || "")
                        setBusinessName(profile.businessName || "")
                        setEditing(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </XStack>
                </YStack>
              ) : (
                <YStack gap="$1">
                  <Paragraph fontSize="$6" fontWeight="600">
                    {profile.name || "Your Profile"}
                  </Paragraph>
                  <Paragraph fontSize="$3" color="$colorSecondary">
                    {profile.phone}
                  </Paragraph>
                  {profile.businessName && (
                    <Paragraph fontSize="$3" color="$colorSecondary">
                      {profile.businessName}
                    </Paragraph>
                  )}
                </YStack>
              )}
            </YStack>
          </XStack>
          {!editing && (
            <Button intent="secondary" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </XStack>
      </ProfileCard>

      <ProfileCard>
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap={0} flex={1}>
            <Paragraph fontSize="$5" fontWeight="600">
              {isAvailable ? "Available for jobs" : "Unavailable"}
            </Paragraph>
            <Paragraph fontSize="$3" color="$colorSecondary">
              {isAvailable
                ? "You're visible to customers and can receive new job requests"
                : "You won't receive new job requests while unavailable"}
            </Paragraph>
          </YStack>
          {!availabilityLoading && (
            <ToggleSwitchTrack
              active={isAvailable}
              onPress={toggleAvailability}
            >
              <ToggleSwitchKnob active={isAvailable} />
            </ToggleSwitchTrack>
          )}
        </XStack>
      </ProfileCard>

      <ProfileCard>
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack gap={0} flex={1}>
            <Paragraph fontSize="$5" fontWeight="600">
              Services You Offer
            </Paragraph>
            <Paragraph fontSize="$3" color="$colorSecondary">
              The services you're qualified to provide to customers
            </Paragraph>
          </YStack>
          {!editingServices && (
            <Button intent="secondary" size="sm" onClick={handleEditServices}>
              Edit
            </Button>
          )}
        </XStack>
        {editingServices ? (
          <YStack gap="$3">
            <XStack flexWrap="wrap" gap="$2">
              {allServices.map((service) => (
                <SelectableServiceChip
                  key={service.id}
                  selected={selectedServiceIds.has(service.id)}
                  onPress={() => toggleServiceSelection(service.id)}
                >
                  {selectedServiceIds.has(service.id) && <Check size={14} color="white" />}
                  <Paragraph
                    fontSize="$3"
                    fontWeight="500"
                    color={selectedServiceIds.has(service.id) ? "white" : "$color"}
                  >
                    {service.name}
                  </Paragraph>
                </SelectableServiceChip>
              ))}
            </XStack>
            <XStack gap="$2">
              <Button size="sm" onClick={handleSaveServices} disabled={savingServices}>
                {savingServices ? "Saving..." : "Save"}
              </Button>
              <Button
                intent="secondary"
                size="sm"
                onClick={() => setEditingServices(false)}
              >
                Cancel
              </Button>
            </XStack>
          </YStack>
        ) : profile.services.length > 0 ? (
          <XStack flexWrap="wrap" gap="$2">
            {profile.services.map((service) => (
              <ServiceChip key={service.id}>
                <Paragraph fontSize="$3" fontWeight="500" color="white">
                  {service.name}
                </Paragraph>
              </ServiceChip>
            ))}
          </XStack>
        ) : (
          <Paragraph color="$colorSecondary">No services configured</Paragraph>
        )}
      </ProfileCard>

      <ProfileCard>
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack gap={0} flex={1}>
            <Paragraph fontSize="$5" fontWeight="600">
              Service Areas
            </Paragraph>
            <Paragraph fontSize="$3" color="$colorSecondary">
              Geographic areas where you accept job requests
            </Paragraph>
          </YStack>
          {!editingAreas && (
            <Button intent="secondary" size="sm" onClick={handleEditAreas}>
              Edit
            </Button>
          )}
        </XStack>
        {editingAreas ? (
          <YStack gap="$3">
            {editableAreas.map((area, index) => (
              <AreaRow key={index}>
                <YStack flex={1} gap="$1">
                  <Label>Location</Label>
                  {area.displayName && area.lat !== null ? (
                    <XStack alignItems="center" gap="$2">
                      <Paragraph fontSize="$3" flex={1}>{area.displayName}</Paragraph>
                      <Button
                        intent="secondary"
                        size="sm"
                        onClick={() => handleAreaSearchChange(index, "")}
                      >
                        Change
                      </Button>
                    </XStack>
                  ) : (
                    <LocationSearchInput
                      value={area.searchValue}
                      onChange={(value) => handleAreaSearchChange(index, value)}
                      onSelect={(location) => handleAreaSelect(index, location)}
                      placeholder="Search for a street or suburb..."
                    />
                  )}
                </YStack>
                <YStack width={100} gap="$1">
                  <Label>Radius (km)</Label>
                  <SmallInput
                    type="number"
                    min="1"
                    max="100"
                    value={area.radiusKm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleAreaRadiusChange(index, e.target.value)
                    }
                    placeholder="10"
                  />
                </YStack>
                <YStack gap="$1">
                  <Label opacity={0}>X</Label>
                  <RemoveButton onPress={() => handleRemoveArea(index)}>
                    <X size={16} color="$red9" />
                  </RemoveButton>
                </YStack>
              </AreaRow>
            ))}
            <Button
              intent="secondary"
              size="sm"
              onClick={handleAddArea}
              alignSelf="flex-start"
            >
              <Plus size={16} />
              Add Area
            </Button>
            <XStack gap="$2">
              <Button size="sm" onClick={handleSaveAreas} disabled={savingAreas}>
                {savingAreas ? "Saving..." : "Save"}
              </Button>
              <Button
                intent="secondary"
                size="sm"
                onClick={() => setEditingAreas(false)}
              >
                Cancel
              </Button>
            </XStack>
          </YStack>
        ) : profile.areas.length > 0 ? (
          <YStack gap="$2">
            {profile.areas.map((area) => (
              <AreaChip key={area.id}>
                <MapPin size={16} color="$colorSecondary" />
                <Paragraph fontSize="$3">
                  {area.displayName || `${area.lat.toFixed(4)}, ${area.lng.toFixed(4)}`}
                </Paragraph>
                <Paragraph fontSize="$3" color="$colorSecondary">
                  ({area.radiusKm}km radius)
                </Paragraph>
              </AreaChip>
            ))}
          </YStack>
        ) : (
          <Paragraph color="$colorSecondary">No service areas configured</Paragraph>
        )}
      </ProfileCard>

      <Paragraph fontSize="$2" color="$colorSecondary" textAlign="center">
        Member since {new Date(profile.createdAt).toLocaleDateString()}
      </Paragraph>
    </DashboardContent>
  )
}
