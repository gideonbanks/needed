"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  Suspense,
  type TextareaHTMLAttributes,
  useEffect,
  useState,
} from "react"
import { Paragraph, styled, YStack } from "tamagui"
import { BackButton } from "components/BackButton/BackButton"
import { Button } from "components/Button/Button"
import {
  ContentContainer,
  Title,
} from "components/styled/request-flow"
import {
  DEFAULT_NZ_COORDINATES,
  resolveNzStreetCoordinates,
  searchNzStreets,
  type StreetResult,
} from "lib/geo/nz-street-centroids"
import {
  loadNzLocalityLookup,
  normalizeNzSuburb,
} from "lib/geo/nz-suburb-centroids"
import { readRequestDetailsFromSessionStorage, writeRequestDetailsToSessionStorage } from "lib/request/storage"
import { createNamedStyle } from "lib/tamagui-utils"

// Form-specific styled components
const FormField = styled(YStack, {
  name: "FormField",
  width: "100%",
  gap: "$2",
})

const Label = styled(Paragraph, {
  name: "Label",
  fontSize: "$4",
  fontWeight: "600",
  color: "$color", // Theme-aware text color
})

// Tamagui styled() workaround for native inputs (avoids TS incompatibilities)
const StyledInput = createNamedStyle("input", {
  name: "StyledInput",
  width: "100%",
  minHeight: 48,
  fontSize: 18,
  borderWidth: 1,
  borderColor: "$borderColor", // Theme-aware border
  borderRadius: "$2", // Smaller radius to match buttons
  paddingHorizontal: "$4",
  backgroundColor: "$backgroundStrong", // Theme-aware background
  color: "$color", // Theme-aware text color
  fontFamily: "$body",
  outline: "none",
  focusStyle: {
    borderColor: "$accent6", // Accent color on focus
    borderWidth: 2,
    boxShadow: "0 0 0 3px rgba(var(--color-accent-6-rgb), 0.1)", // Subtle accent glow
  },
}) as React.ComponentType<InputHTMLAttributes<HTMLInputElement>>

const AutocompleteContainer = styled(YStack, {
  name: "AutocompleteContainer",
  position: "relative",
  width: "100%",
})

const SuggestionsBox = createNamedStyle("div", {
  name: "SuggestionsBox",
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  marginTop: "$2",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$2",
  backgroundColor: "$backgroundStrong",
  overflow: "hidden",
  zIndex: 20,
  maxHeight: 240,
  overflowY: "auto",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
}) as React.ComponentType<HTMLAttributes<HTMLDivElement>>

const SuggestionItem = createNamedStyle("button", {
  name: "SuggestionItem",
  width: "100%",
  paddingVertical: "$3",
  paddingHorizontal: "$4",
  // Avoid passing `textAlign` as a DOM prop (React warning); use layout instead.
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  backgroundColor: "transparent",
  borderWidth: 0,
  color: "$color",
  fontFamily: "$body",
  fontSize: "$4",
  cursor: "pointer",
  hoverStyle: {
    backgroundColor: "$backgroundHover",
  },
  focusStyle: {
    backgroundColor: "$backgroundHover",
    outline: "none",
  },
}) as React.ComponentType<ButtonHTMLAttributes<HTMLButtonElement>>

const SuggestionLabel = styled(Paragraph, {
  name: "SuggestionLabel",
  fontSize: "$4",
  color: "$color",
  margin: 0,
})

// Tamagui styled() workaround for native textareas (avoids TS incompatibilities)
const StyledTextArea = createNamedStyle("textarea", {
  name: "StyledTextArea",
  width: "100%",
  minHeight: 120,
  fontSize: 18,
  borderWidth: 1,
  borderColor: "$borderColor", // Theme-aware border
  borderRadius: "$2", // Smaller radius to match buttons
  padding: "$4",
  backgroundColor: "$backgroundStrong", // Theme-aware background
  color: "$color", // Theme-aware text color
  fontFamily: "$body",
  resize: "vertical",
  outline: "none",
  focusStyle: {
    borderColor: "$accent6", // Accent color on focus
    borderWidth: 2,
    boxShadow: "0 0 0 3px rgba(var(--color-accent-6-rgb), 0.1)", // Subtle accent glow
  },
}) as React.ComponentType<TextareaHTMLAttributes<HTMLTextAreaElement>>

const ErrorMessage = styled(Paragraph, {
  name: "ErrorMessage",
  fontSize: "$3",
  color: "$red9",
  marginTop: "$1",
})

const HelperText = styled(Paragraph, {
  name: "HelperText",
  fontSize: "$3",
  color: "$colorSecondary",
  marginTop: "$1",
})

// Service-specific placeholders
const SERVICE_PLACEHOLDERS: Record<string, string> = {
  plumber: "e.g., Blocked drain, leaking tap, new installation",
  electrician: "e.g., Power outage, wiring issue, new outlet needed",
  locksmith: "e.g., Locked out, broken lock, key replacement",
  movers: "e.g., Moving from X to Y, number of rooms, date",
  "carpet-cleaning": "e.g., Number of rooms, stains, pet odors",
  "rubbish-removal": "e.g., What items, approximate size, location",
}

const DEFAULT_COORDINATES = DEFAULT_NZ_COORDINATES

function RequestDetailsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const service = searchParams.get("service")
  const time = searchParams.get("time")
  const suburbParam = searchParams.get("suburb")
  const latParam = searchParams.get("lat")
  const lngParam = searchParams.get("lng")
  const detailsParam = searchParams.get("details")

  const [suburb, setSuburb] = useState("")
  const [details, setDetails] = useState("")
  const [errors, setErrors] = useState<{ suburb?: string; details?: string }>({})
  const [suggestions, setSuggestions] = useState<StreetResult[]>([])
  const [isSuburbFocused, setIsSuburbFocused] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [localityLookup, setLocalityLookup] = useState<
    Map<string, { lat: number; lng: number; linzId?: number }> | null
  >(null)
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    if (!service || !time) {
      router.push("/request")
    }
  }, [service, time, router])

  // Hydrate form state from URL params or sessionStorage (once).
  useEffect(() => {
    if (hasHydrated) return
    if (!service || !time) return

    const stored = readRequestDetailsFromSessionStorage()

    const nextSuburb = (suburbParam ?? stored?.suburb ?? "").trim()
    const nextDetails = (detailsParam ?? stored?.details ?? "").trim()

    if (nextSuburb) setSuburb(nextSuburb)
    if (nextDetails) setDetails(nextDetails)

    const parsedLat = latParam ? Number.parseFloat(latParam) : stored?.lat ?? null
    const parsedLng = lngParam ? Number.parseFloat(lngParam) : stored?.lng ?? null
    if (
      typeof parsedLat === "number" &&
      Number.isFinite(parsedLat) &&
      typeof parsedLng === "number" &&
      Number.isFinite(parsedLng)
    ) {
      setSelectedCoordinates({ lat: parsedLat, lng: parsedLng })
    }

    setHasHydrated(true)
  }, [detailsParam, hasHydrated, latParam, lngParam, router, service, suburbParam, time])

  // Load localities lookup once (CDN-cached public JSON)
  useEffect(() => {
    let cancelled = false
    loadNzLocalityLookup()
      .then((lookup) => {
        if (cancelled) return
        setLocalityLookup(lookup)
      })
      .catch(() => {
        if (cancelled) return
        setLocalityLookup(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Debounced API search
  useEffect(() => {
    const query = suburb.trim()
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    const timeoutId = setTimeout(async () => {
      const commaIdx = query.indexOf(",")
      const localityPart = commaIdx >= 0 ? query.slice(commaIdx + 1).trim() : ""
      const normalizedLocality = localityPart ? normalizeNzSuburb(localityPart) : ""
      const localityId =
        normalizedLocality && localityLookup
          ? localityLookup.get(normalizedLocality)?.linzId ?? null
          : null

      const results = await searchNzStreets(query, commaIdx >= 0 ? { localityId, locality: localityPart } : undefined)
      setSuggestions(results)
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [suburb, localityLookup])

  // Persist draft as the user types (debounced).
  useEffect(() => {
    if (!service || !time) return

    const timeoutId = setTimeout(() => {
      writeRequestDetailsToSessionStorage({
        service,
        time,
        suburb: suburb.trim() || null,
        details: details.trim() || null,
        lat: selectedCoordinates?.lat ?? null,
        lng: selectedCoordinates?.lng ?? null,
      })
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [details, selectedCoordinates?.lat, selectedCoordinates?.lng, service, suburb, time])

  if (!service || !time) {
    return null
  }

  const showSuggestions = isSuburbFocused && suggestions.length > 0

  useEffect(() => {
    if (!showSuggestions) {
      setActiveSuggestionIndex(-1)
      return
    }
    setActiveSuggestionIndex((prev) => {
      if (prev < 0) return 0
      return Math.min(prev, suggestions.length - 1)
    })
  }, [showSuggestions, suggestions.length])

  const handleSuburbChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSuburb(event.target.value)
    setSelectedCoordinates(null)
    if (errors.suburb) {
      setErrors((prev) => ({ ...prev, suburb: undefined }))
    }
  }

  const selectSuggestion = (suggestion: StreetResult) => {
    setSuburb(suggestion.displayName)
    setSelectedCoordinates({ lat: suggestion.lat, lng: suggestion.lng })
    setIsSuburbFocused(false)
    setActiveSuggestionIndex(-1)
    setSuggestions([])
    if (errors.suburb) {
      setErrors((prev) => ({ ...prev, suburb: undefined }))
    }
  }

  const handleSuburbKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0))
      return
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault()
      const selected = suggestions[activeSuggestionIndex]
      if (selected) {
        selectSuggestion(selected)
      }
      return
    }

    if (event.key === "Escape") {
      setIsSuburbFocused(false)
      setActiveSuggestionIndex(-1)
    }
  }

  const handleSubmit = async () => {
    // Reset errors
    const newErrors: { suburb?: string; details?: string } = {}

    const input = suburb.trim()
    if (!input) {
      newErrors.suburb = "Add your street to continue."
    }

    if (!details.trim()) {
      newErrors.details = "Add a short description so pros know what to do."
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const commaIdx = input.indexOf(",")
    const localityPart = commaIdx >= 0 ? input.slice(commaIdx + 1).trim() : ""
    const normalizedLocality = localityPart ? normalizeNzSuburb(localityPart) : ""
    const localityId =
      normalizedLocality && localityLookup
        ? localityLookup.get(normalizedLocality)?.linzId ?? null
        : null

    const resolvedCoordinates =
      selectedCoordinates ??
      (await resolveNzStreetCoordinates(
        input,
        commaIdx >= 0 ? { localityId, locality: localityPart } : undefined
      )) ??
      DEFAULT_COORDINATES
    const { lat, lng } = resolvedCoordinates

    writeRequestDetailsToSessionStorage({
      service,
      time,
      suburb: input,
      details,
      lat,
      lng,
    })

    const params = new URLSearchParams({
      service,
      time,
      suburb: input,
      lat: String(lat),
      lng: String(lng),
    })

    // Navigate to phone verification
    router.push(`/request/verify-phone?${params.toString()}`)
  }

  const placeholder = SERVICE_PLACEHOLDERS[service] || "Describe what you need help with..."
  const suburbInputId = "request-suburb"
  const suggestionsId = "suburb-suggestions"

  return (
    <>
      <BackButton
        href={`/request/time?service=${service}`}
      />
      <ContentContainer>
        <Title>Tell us what's going on</Title>

        <FormField>
          <Label>Your street</Label>
          <AutocompleteContainer>
            <StyledInput
              id={suburbInputId}
              placeholder="e.g. Daldy Street, Auckland Central"
              value={suburb}
              onChange={handleSuburbChange}
              style={{ fontFamily: "inherit" }}
              onFocus={() => setIsSuburbFocused(true)}
              onBlur={() => setIsSuburbFocused(false)}
              onKeyDown={handleSuburbKeyDown}
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls={suggestionsId}
              aria-autocomplete="list"
              autoFocus
            />
            {showSuggestions && (
              <SuggestionsBox id={suggestionsId} role="listbox">
                {suggestions.map((suggestion, index) => (
                  <SuggestionItem
                    key={suggestion.id}
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
                    style={index === activeSuggestionIndex ? { backgroundColor: "var(--background-hover)" } : undefined}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <SuggestionLabel>{suggestion.displayName}</SuggestionLabel>
                  </SuggestionItem>
                ))}
              </SuggestionsBox>
            )}
          </AutocompleteContainer>
          {errors.suburb && <ErrorMessage>{errors.suburb}</ErrorMessage>}
        </FormField>

        <FormField>
          <Label>Job details</Label>
          <StyledTextArea
            id="request-details"
            placeholder={placeholder}
            value={details}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDetails(e.target.value)}
            style={{ fontFamily: "inherit" }}
            rows={4}
          />
          {errors.details && <ErrorMessage>{errors.details}</ErrorMessage>}
        </FormField>

        <FormField>
          <Label>Add photo (optional)</Label>
          <Button
            intent="secondary"
            size="sm"
            disabled
          >
            Coming soon
          </Button>
          <HelperText>Photo uploads are on the way.</HelperText>
        </FormField>

        <Button
          onClick={handleSubmit}
          size="lg"
          width="100%"
          marginTop="$4"
        >
          Send to 3 pros
        </Button>
      </ContentContainer>
    </>
  )
}

export default function RequestDetailsPage() {
  // `useSearchParams()` must be used under a Suspense boundary for Next to
  // handle CSR bailouts safely during prerender.
  return (
    <Suspense fallback={<Paragraph>Loading...</Paragraph>}>
      <RequestDetailsContent />
    </Suspense>
  )
}
