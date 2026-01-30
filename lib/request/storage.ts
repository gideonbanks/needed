import { REQUEST_DETAILS_STORAGE_KEY } from "./constants"

export type StoredRequestDetails = {
  details: string | null
  phone: string | null
  suburb?: string | null
  lat?: number | null
  lng?: number | null
  service?: string | null
  time?: string | null
}

export function readRequestDetailsFromSessionStorage(): StoredRequestDetails | null {
  try {
    const stored = sessionStorage.getItem(REQUEST_DETAILS_STORAGE_KEY)
    if (!stored) return null

    try {
      const parsed = JSON.parse(stored) as unknown
      if (parsed && typeof parsed === "object" && parsed !== null) {
        const obj = parsed as {
          details?: unknown
          phone?: unknown
          suburb?: unknown
          lat?: unknown
          lng?: unknown
          service?: unknown
          time?: unknown
        }
        return {
          details: typeof obj.details === "string" ? obj.details : null,
          phone: typeof obj.phone === "string" ? obj.phone : null,
          suburb: typeof obj.suburb === "string" ? obj.suburb : null,
          lat: typeof obj.lat === "number" && Number.isFinite(obj.lat) ? obj.lat : null,
          lng: typeof obj.lng === "number" && Number.isFinite(obj.lng) ? obj.lng : null,
          service: typeof obj.service === "string" ? obj.service : null,
          time: typeof obj.time === "string" ? obj.time : null,
        }
      }
    } catch {
      // fall through to string fallback
    }

    // Backward-compatible fallback: older code may store raw details as a string
    return { details: stored, phone: null }
  } catch {
    // Ignore storage access errors (Safari private mode, blocked storage, etc.)
    return null
  }
}

export function writeRequestDetailsToSessionStorage(update: Partial<StoredRequestDetails>) {
  try {
    const existing = readRequestDetailsFromSessionStorage() ?? { details: null, phone: null }
    const next: StoredRequestDetails = {
      ...existing,
      ...update,
    }
    sessionStorage.setItem(REQUEST_DETAILS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage access errors (Safari private mode, blocked storage, etc.)
  }
}
