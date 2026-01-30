#!/usr/bin/env node
/**
 * Build `nz_road_names` rows from the public LINZ NZ Addresses ArcGIS service.
 *
 * Outputs:
 * - supabase/seed/nz_road_names.csv (road_name, locality_linz_id, locality_name, ta)
 *
 * Usage:
 *   node scripts/build-nz-road-names.mjs
 *   node scripts/build-nz-road-names.mjs --limit 200000
 *   node scripts/build-nz-road-names.mjs --output supabase/seed/nz_road_names.csv
 *   node scripts/build-nz-road-names.mjs --start-oid 0 --max-pages 100
 *
 * Then import into local Supabase Postgres:
 *   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
 *     -c "\\copy public.nz_road_names(road_name,locality_linz_id,locality_name,ta) FROM 'supabase/seed/nz_road_names.csv' WITH (FORMAT csv, HEADER true)"
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, "..")

const DEFAULT_OUTPUT = path.join(ROOT_DIR, "supabase", "seed", "nz_road_names.csv")

// LINZ NZ Addresses (Pilot) - public ArcGIS feature service.
// Contains `full_road_name`, `suburb_locality`, `town_city`, `territorial_authority`, etc.
const LINZ_ADDRESSES_QUERY =
  "https://services.arcgis.com/xdsHIIxuCWByZiCB/ArcGIS/rest/services/LINZ_NZ_Addresses_Pilot/FeatureServer/0/query"

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const csvEscape = (value) => {
  const str = String(value ?? "")
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const parseArgs = () => {
  const args = process.argv.slice(2)
  const out = { output: DEFAULT_OUTPUT, limit: Infinity, startOid: 0, maxPages: Infinity }

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i]
    if (a === "--output" && args[i + 1]) {
      out.output = path.resolve(ROOT_DIR, args[i + 1])
      i += 1
      continue
    }
    if (a === "--limit" && args[i + 1]) {
      out.limit = Math.max(0, Number(args[i + 1]) || 0)
      i += 1
      continue
    }
    if (a === "--start-oid" && args[i + 1]) {
      out.startOid = Math.max(0, Number(args[i + 1]) || 0)
      i += 1
      continue
    }
    if (a === "--max-pages" && args[i + 1]) {
      out.maxPages = Math.max(0, Number(args[i + 1]) || 0)
      i += 1
      continue
    }
  }

  return out
}

const loadLocalityNameToLinzId = async () => {
  // `public/data/nz-localities.min.json` has normalized name keys and linzId (4th element).
  const jsonPath = path.join(ROOT_DIR, "public", "data", "nz-localities.min.json")
  const data = JSON.parse(await fs.readFile(jsonPath, "utf8"))
  const records = Array.isArray(data.records) ? data.records : []

  const map = new Map()
  for (const record of records) {
    if (!Array.isArray(record) || record.length < 4) continue
    const [key, , , linzId] = record
    if (typeof key !== "string" || typeof linzId !== "number") continue
    map.set(key, linzId)
  }
  return map
}

const fetchAddressesPage = async ({ afterObjectId, pageSize }) => {
  const where =
    `OBJECTID > ${Number(afterObjectId)}` +
    " AND full_road_name IS NOT NULL" +
    " AND (suburb_locality IS NOT NULL OR town_city IS NOT NULL)"

  const params = new URLSearchParams({
    where,
    outFields: "OBJECTID,full_road_name,suburb_locality,town_city,territorial_authority",
    orderByFields: "OBJECTID",
    resultRecordCount: String(pageSize),
    returnGeometry: "false",
    f: "json",
  })

  const response = await fetch(`${LINZ_ADDRESSES_QUERY}?${params.toString()}`, {
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    throw new Error(`LINZ addresses request failed (${response.status})`)
  }
  const data = await response.json()
  if (data?.error) {
    throw new Error(
      `LINZ API error: ${
        typeof data.error?.message === "string"
          ? data.error.message
          : JSON.stringify(data.error)
      }`
    )
  }
  const features = Array.isArray(data.features) ? data.features : []
  return features
}

const run = async () => {
  const { output, limit, startOid, maxPages } = parseArgs()

  const localityMap = await loadLocalityNameToLinzId()
  const pageSize = 2000

  const rows = []
  const seen = new Set()
  let skippedNoLinzId = 0

  let lastOid = startOid
  let page = 0

  console.log(`Streaming LINZ NZ Addresses from OBJECTID > ${lastOid} ...`)

  while (rows.length < limit && page < maxPages) {
    page += 1
    const features = await fetchAddressesPage({ afterObjectId: lastOid, pageSize })
    if (features.length === 0) break

    let maxOidInPage = lastOid
    for (const feature of features) {
      const a = feature?.attributes ?? {}
      const oid = typeof a.OBJECTID === "number" ? a.OBJECTID : null
      if (oid !== null) {
        maxOidInPage = Math.max(maxOidInPage, oid)
      }

      const roadName = typeof a.full_road_name === "string" ? a.full_road_name.trim() : ""
      if (!roadName) continue

      const suburbLocality =
        typeof a.suburb_locality === "string" ? a.suburb_locality.trim() : ""
      const townCity = typeof a.town_city === "string" ? a.town_city.trim() : ""
      const localityName = suburbLocality || townCity
      if (!localityName) continue

      const ta =
        typeof a.territorial_authority === "string" ? a.territorial_authority.trim() : ""

      const normalizedLocality = normalize(localityName)
      const linzId = localityMap.get(normalizedLocality)
      if (typeof linzId !== "number") {
        skippedNoLinzId += 1
        continue
      }

      const key = `${roadName.toLowerCase()}|${linzId}`
      if (seen.has(key)) continue
      seen.add(key)

      rows.push({
        road_name: roadName,
        locality_linz_id: linzId,
        locality_name: localityName,
        ta: ta || null,
      })
      if (rows.length >= limit) break
    }

    lastOid = maxOidInPage
    if (page % 25 === 0) {
      console.log(`Progress: pages=${page} lastOid=${lastOid} uniqueRoads=${rows.length} skippedNoLinzId=${skippedNoLinzId}`)
    }
  }

  const header = ["road_name", "locality_linz_id", "locality_name", "ta"].join(",")
  const lines = [header]
  for (const row of rows) {
    lines.push(
      [
        csvEscape(row.road_name),
        csvEscape(row.locality_linz_id),
        csvEscape(row.locality_name),
        csvEscape(row.ta ?? ""),
      ].join(",")
    )
  }

  await fs.mkdir(path.dirname(output), { recursive: true })
  await fs.writeFile(output, `${lines.join("\n")}\n`)

  console.log(`Wrote ${rows.length} nz_road_names rows to ${output}`)
  console.log(`Skipped ${skippedNoLinzId} rows (locality not matched to LINZ id)`)
  console.log("")
  console.log("Import into local Supabase:")
  console.log(
    `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\\\\copy public.nz_road_names(road_name,locality_linz_id,locality_name,ta) FROM '${path.relative(
      ROOT_DIR,
      output
    )}' WITH (FORMAT csv, HEADER true)"`
  )
}

run().catch((error) => {
  console.error("Failed to build nz_road_names.csv:", error)
  process.exitCode = 1
})

