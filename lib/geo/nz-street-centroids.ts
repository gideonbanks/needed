export type StreetResult = {
  id: number
  street: string
  locality: string
  localityId?: number
  ta: string | null
  lat: number
  lng: number
  displayName: string
}

export const DEFAULT_NZ_COORDINATES = {
  lat: -36.8485,
  lng: 174.7633,
}

export const normalizeNzStreet = (value: string) =>
  value
    .toLowerCase()
    .replace(/[,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

type SearchResponse = {
  results: StreetResult[]
  error?: string
}

export type NzStreetSearchOptions = {
  locality?: string | null
  localityId?: number | null
}

export async function searchNzStreets(
  query: string,
  options?: NzStreetSearchOptions
): Promise<StreetResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return []
  }

  try {
    // Support scoping by locality when user types: "Street, Locality"
    const commaIdx = trimmed.indexOf(",")
    const streetQuery = (commaIdx >= 0 ? trimmed.slice(0, commaIdx) : trimmed).trim()
    const inlineLocalityQuery = (commaIdx >= 0 ? trimmed.slice(commaIdx + 1) : "").trim()

    if (streetQuery.length < 2) {
      return []
    }

    const params = new URLSearchParams({ q: streetQuery })
    const localityId = options?.localityId ?? null
    const locality = options?.locality?.trim() ?? null
    const localityQuery = inlineLocalityQuery.length > 0 ? inlineLocalityQuery : locality

    if (typeof localityId === "number" && Number.isFinite(localityId)) {
      params.set("localityId", String(localityId))
    } else if (localityQuery && localityQuery.length > 0) {
      params.set("locality", localityQuery)
    }
    const response = await fetch(`/api/address/search?${params.toString()}`)

    if (!response.ok) {
      return []
    }

    const data = (await response.json()) as SearchResponse
    return data.results || []
  } catch {
    return []
  }
}

export async function resolveNzStreetCoordinates(
  input: string,
  options?: NzStreetSearchOptions
): Promise<{ lat: number; lng: number } | null> {
  const results = await searchNzStreets(input, options)
  if (results.length === 0) return null

  // Return the first exact match or first result
  const normalized = normalizeNzStreet(input)
  const exactMatch = results.find(
    (r) => normalizeNzStreet(r.displayName) === normalized
  )

  if (exactMatch) {
    return { lat: exactMatch.lat, lng: exactMatch.lng }
  }

  const first = results[0]
  if (!first) return null

  return { lat: first.lat, lng: first.lng }
}

// Legacy compatibility - returns empty array since we now use API search
export async function loadNzStreetSuggestions(): Promise<
  Array<{ label: string; normalized: string; lat: number; lng: number }>
> {
  return []
}
