"use client"

import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useState,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
} from "react"
import { Paragraph, styled, YStack } from "tamagui"
import { loadNzLocalitySuggestions, type LocalitySuggestion } from "lib/geo/nz-suburb-centroids"
import { createNamedStyle } from "lib/tamagui-utils"

const AutocompleteContainer = styled(YStack, {
  name: "AutocompleteContainer",
  position: "relative",
  width: "100%",
})

const StyledInput = createNamedStyle("input", {
  name: "LocationInput",
  width: "100%",
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
}) as React.ComponentType<InputHTMLAttributes<HTMLInputElement>>

const SuggestionsBox = createNamedStyle("div", {
  name: "SuggestionsBox",
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  marginTop: "$1",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$2",
  backgroundColor: "$backgroundStrong",
  overflow: "hidden",
  zIndex: 50,
  maxHeight: 200,
  overflowY: "auto",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
}) as React.ComponentType<HTMLAttributes<HTMLDivElement>>

const SuggestionItem = createNamedStyle("button", {
  name: "SuggestionItem",
  width: "100%",
  paddingVertical: "$2",
  paddingHorizontal: "$3",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  backgroundColor: "transparent",
  borderWidth: 0,
  color: "$color",
  fontFamily: "$body",
  fontSize: "$3",
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
  fontSize: "$3",
  color: "$color",
  margin: 0,
})

export interface LocationValue {
  displayName: string
  lat: number
  lng: number
}

interface LocationSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSelect: (location: LocationValue) => void
  placeholder?: string
}

export function LocationSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "Search for a suburb or area...",
}: LocationSearchInputProps) {
  const [allLocalities, setAllLocalities] = useState<LocalitySuggestion[]>([])
  const [suggestions, setSuggestions] = useState<LocalitySuggestion[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

  // Load all localities on mount
  useEffect(() => {
    loadNzLocalitySuggestions().then(setAllLocalities).catch(console.error)
  }, [])

  // Filter localities based on search query
  useEffect(() => {
    const query = value.trim().toLowerCase()
    if (query.length < 2 || allLocalities.length === 0) {
      setSuggestions([])
      return
    }

    // Filter and sort results
    const filtered = allLocalities
      .filter((loc) => loc.normalized.includes(query) || loc.label.toLowerCase().includes(query))
      .sort((a, b) => {
        // Prioritize exact prefix matches
        const aStartsWithQuery = a.normalized.startsWith(query) || a.label.toLowerCase().startsWith(query)
        const bStartsWithQuery = b.normalized.startsWith(query) || b.label.toLowerCase().startsWith(query)
        if (aStartsWithQuery && !bStartsWithQuery) return -1
        if (!aStartsWithQuery && bStartsWithQuery) return 1
        // Then sort alphabetically
        return a.label.localeCompare(b.label)
      })
      .slice(0, 10)

    setSuggestions(filtered)
  }, [value, allLocalities])

  const showSuggestions = isFocused && suggestions.length > 0

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

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  const selectSuggestion = (suggestion: LocalitySuggestion) => {
    onSelect({
      displayName: suggestion.label,
      lat: suggestion.lat,
      lng: suggestion.lng,
    })
    setActiveSuggestionIndex(-1)
    setSuggestions([])
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
      setIsFocused(false)
      setActiveSuggestionIndex(-1)
    }
  }

  return (
    <AutocompleteContainer>
      <StyledInput
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-autocomplete="list"
      />
      {showSuggestions && (
        <SuggestionsBox role="listbox">
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={suggestion.linzId ?? suggestion.normalized}
              type="button"
              role="option"
              aria-selected={index === activeSuggestionIndex}
              style={index === activeSuggestionIndex ? { backgroundColor: "var(--background-hover)" } : undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
            >
              <SuggestionLabel>{suggestion.label}</SuggestionLabel>
            </SuggestionItem>
          ))}
        </SuggestionsBox>
      )}
    </AutocompleteContainer>
  )
}
