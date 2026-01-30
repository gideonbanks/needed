export type SuburbCentroid = {
  name: string
  lat: number
  lng: number
  aliases?: string[]
}

type LocalityRecord = [string, number, number, number?]
type SuggestionRecord = [string, number, number, number?]

type LocalityDataset = {
  records?: LocalityRecord[]
  suggestions?: SuggestionRecord[]
}

export type LocalitySuggestion = {
  label: string
  normalized: string
  lat: number
  lng: number
  linzId?: number
}

// Minimal starter list used when the full dataset has not been generated yet.
const FALLBACK_CENTROIDS: SuburbCentroid[] = [
  {
    name: "Auckland CBD",
    lat: -36.8485,
    lng: 174.7633,
    aliases: ["Auckland"],
  },
]

export const normalizeNzSuburb = (value: string) =>
  value
    .toLowerCase()
    .replace(/[,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const createFallbackLookup = () => {
  const lookup = new Map<string, { lat: number; lng: number; linzId?: number }>()
  for (const suburb of FALLBACK_CENTROIDS) {
    lookup.set(normalizeNzSuburb(suburb.name), { lat: suburb.lat, lng: suburb.lng })
    for (const alias of suburb.aliases ?? []) {
      lookup.set(normalizeNzSuburb(alias), { lat: suburb.lat, lng: suburb.lng })
    }
  }
  return lookup
}

const FALLBACK_LOOKUP = createFallbackLookup()
const DATA_URL = "/data/nz-localities.min.json"

type LocalityData = {
  lookup: Map<string, { lat: number; lng: number; linzId?: number }>
  suggestions: LocalitySuggestion[]
}

let localityDataPromise: Promise<LocalityData> | null = null

let hasWarnedLocalityFallback = false
const warnLocalityFallbackOnce = (error: unknown) => {
  if (hasWarnedLocalityFallback) return
  hasWarnedLocalityFallback = true
  console.warn("Failed to load NZ locality data, using fallback:", error)
}

const buildFallbackSuggestions = (centroids: SuburbCentroid[]): LocalitySuggestion[] =>
  centroids.map((suburb) => ({
    label: suburb.name,
    normalized: normalizeNzSuburb(suburb.name),
    lat: suburb.lat,
    lng: suburb.lng,
  }))

const buildSuggestionsFromRecords = (records: LocalityRecord[]): LocalitySuggestion[] => {
  const suggestions: LocalitySuggestion[] = []
  const seen = new Set<string>()

  for (const record of records) {
    if (!Array.isArray(record) || record.length < 3) continue
    const [name, lat, lng, linzId] = record
    if (typeof name !== "string" || typeof lat !== "number" || typeof lng !== "number") {
      continue
    }

    const normalized = normalizeNzSuburb(name)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)

    suggestions.push({
      label: name,
      normalized,
      lat,
      lng,
      linzId: typeof linzId === "number" ? linzId : undefined,
    })
  }

  return suggestions
}

const loadLocalityData = async (): Promise<LocalityData> => {
  if (localityDataPromise) {
    return localityDataPromise
  }

  localityDataPromise = (async () => {
    if (typeof fetch !== "function") {
      return { lookup: FALLBACK_LOOKUP, suggestions: buildFallbackSuggestions(FALLBACK_CENTROIDS) }
    }

    try {
      const response = await fetch(DATA_URL)
      if (!response.ok) {
        return { lookup: FALLBACK_LOOKUP, suggestions: buildFallbackSuggestions(FALLBACK_CENTROIDS) }
      }

      const data = (await response.json()) as LocalityDataset
      const records = data.records ?? []
      if (!Array.isArray(records) || records.length === 0) {
        return { lookup: FALLBACK_LOOKUP, suggestions: buildFallbackSuggestions(FALLBACK_CENTROIDS) }
      }

      const lookup = new Map<string, { lat: number; lng: number; linzId?: number }>()
      for (const record of records) {
        if (!Array.isArray(record) || record.length < 3) continue
        const [name, lat, lng, linzId] = record
        if (typeof name !== "string" || typeof lat !== "number" || typeof lng !== "number") {
          continue
        }
        lookup.set(normalizeNzSuburb(name), {
          lat,
          lng,
          linzId: typeof linzId === "number" ? linzId : undefined,
        })
      }

      const rawSuggestions = data.suggestions ?? []
      const suggestions: LocalitySuggestion[] = []

      if (Array.isArray(rawSuggestions) && rawSuggestions.length > 0) {
        for (const record of rawSuggestions) {
          if (!Array.isArray(record) || record.length < 3) continue
          const [label, lat, lng, linzId] = record
          if (typeof label !== "string" || typeof lat !== "number" || typeof lng !== "number") {
            continue
          }
          const normalized = normalizeNzSuburb(label)
          if (!normalized) continue
          suggestions.push({
            label,
            normalized,
            lat,
            lng,
            linzId: typeof linzId === "number" ? linzId : undefined,
          })
        }
      } else {
        suggestions.push(...buildSuggestionsFromRecords(records))
      }

      const finalLookup = lookup.size > 0 ? lookup : FALLBACK_LOOKUP
      return {
        lookup: finalLookup,
        suggestions:
          suggestions.length > 0 ? suggestions : buildFallbackSuggestions(FALLBACK_CENTROIDS),
      }
    } catch (error) {
      warnLocalityFallbackOnce(error)
      return { lookup: FALLBACK_LOOKUP, suggestions: buildFallbackSuggestions(FALLBACK_CENTROIDS) }
    }
  })()

  return localityDataPromise
}

export const DEFAULT_NZ_COORDINATES = {
  lat: -36.8485,
  lng: 174.7633,
}

export async function loadNzLocalityLookup() {
  const data = await loadLocalityData()
  return data.lookup
}

export async function loadNzLocalitySuggestions() {
  const data = await loadLocalityData()
  return data.suggestions
}

export async function resolveNzSuburbCoordinates(input: string) {
  const normalized = normalizeNzSuburb(input)
  if (!normalized) return null

  const lookup = await loadNzLocalityLookup()
  return lookup.get(normalized) ?? null
}
