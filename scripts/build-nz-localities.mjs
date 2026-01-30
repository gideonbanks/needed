#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SERVICE_BASE =
  "https://services.arcgis.com/xdsHIIxuCWByZiCB/arcgis/rest/services/LINZ_NZ_Suburbs_and_Localities/FeatureServer/0"
const QUERY_URL = `${SERVICE_BASE}/query`

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..")
const OUTPUT_JSON = path.join(ROOT_DIR, "public", "data", "nz-localities.min.json")
const OUTPUT_SQL = path.join(ROOT_DIR, "supabase", "seed", "nz_localities.sql")

const round = (value, places = 5) =>
  Math.round(value * 10 ** places) / 10 ** places

const normalizeName = (value) =>
  value
    .toLowerCase()
    .replace(/[,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const splitAliases = (value) => {
  if (!value) return []
  return value
    .split(/(?:\s*;\s*|\s*\/\s*|\s*\|\s*)/g)
    .map((item) => item.trim())
    .filter(Boolean)
}

const sqlEscape = (value) =>
  value === null || value === undefined
    ? "NULL"
    : `'${String(value).replace(/'/g, "''")}'`

const sqlArray = (values) => {
  if (!values || values.length === 0) return "ARRAY[]::text[]"
  return `ARRAY[${values.map(sqlEscape).join(", ")}]`
}

const formatTerritorialAuthority = (value) => {
  if (!value) return null
  if (value === "Area outside Territorial Authority") return "Outside Territorial Authority"
  return value.replace(/\s+(District|City|Region|Territory)$/i, "")
}

const fetchJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`)
  }
  return response.json()
}

const parseSqlString = (value) => {
  if (value === "NULL") return null
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'")
  }
  return value
}

const splitSqlFields = (row) => {
  const fields = []
  let current = ""
  let inString = false
  let bracketDepth = 0

  for (let i = 0; i < row.length; i += 1) {
    const char = row[i]

    if (inString) {
      if (char === "'" && row[i + 1] === "'") {
        current += "''"
        i += 1
        continue
      }
      if (char === "'") {
        inString = false
        current += char
        continue
      }
      current += char
      continue
    }

    if (char === "'") {
      inString = true
      current += char
      continue
    }

    if (char === "[") {
      bracketDepth += 1
      current += char
      continue
    }

    if (char === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1)
      current += char
      continue
    }

    if (char === "," && bracketDepth === 0) {
      fields.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  if (current.trim()) {
    fields.push(current.trim())
  }

  return fields
}

const parseRowsFromSql = (sql) => {
  const rows = []
  let buffer = ""
  let inRow = false
  let inString = false

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i]

    if (inString) {
      if (char === "'" && sql[i + 1] === "'") {
        buffer += "''"
        i += 1
        continue
      }
      if (char === "'") {
        inString = false
      }
      if (inRow) buffer += char
      continue
    }

    if (char === "'") {
      inString = true
      if (inRow) buffer += char
      continue
    }

    if (char === "(" && !inRow) {
      inRow = true
      buffer = ""
      continue
    }

    if (char === ")" && inRow) {
      const fields = splitSqlFields(buffer)
      if (fields.length >= 8) {
        const linzId = Number(fields[0])
        const name = parseSqlString(fields[1])
        const type = parseSqlString(fields[2])
        const majorName = parseSqlString(fields[3])
        const territorialAuthority = parseSqlString(fields[5])
        const lat = Number(fields[6])
        const lng = Number(fields[7])

        if (name && Number.isFinite(linzId) && Number.isFinite(lat) && Number.isFinite(lng)) {
          rows.push({
            linzId,
            name,
            type,
            majorName,
            territorialAuthority,
            lat,
            lng,
          })
        }
      }
      inRow = false
      buffer = ""
      continue
    }

    if (inRow) {
      buffer += char
    }
  }

  return rows
}

const getFieldSet = async () => {
  const info = await fetchJson(`${SERVICE_BASE}?f=pjson`)
  const fields = new Set((info.fields || []).map((field) => field.name))
  return { fields, maxRecordCount: info.maxRecordCount || 2000 }
}

const getCount = async () => {
  const data = await fetchJson(
    `${QUERY_URL}?where=1%3D1&returnCountOnly=true&f=json`
  )
  return data.count || 0
}

const fetchPage = async ({ offset, count, outFields }) => {
  const params = new URLSearchParams({
    where: "1=1",
    outFields,
    returnCentroid: "true",
    outSR: "4326",
    resultOffset: String(offset),
    resultRecordCount: String(count),
    f: "json",
  })

  const url = `${QUERY_URL}?${params.toString()}`
  const data = await fetchJson(url)
  return data.features || []
}

const buildJsonFromSql = async () => {
  const sqlText = await fs.readFile(OUTPUT_SQL, "utf8")
  const rows = parseRowsFromSql(sqlText)

  let existingLookup = new Map()
  try {
    const existingJson = JSON.parse(await fs.readFile(OUTPUT_JSON, "utf8"))
    const records = existingJson.records ?? []
    if (Array.isArray(records)) {
      for (const record of records) {
        if (!Array.isArray(record) || record.length < 3) continue
        const [name, lat, lng, linzId] = record
        if (typeof name !== "string" || typeof lat !== "number" || typeof lng !== "number") {
          continue
        }
        existingLookup.set(name, {
          lat,
          lng,
          linzId: typeof linzId === "number" ? linzId : undefined,
        })
      }
    }
  } catch {
    existingLookup = new Map()
  }

  const buildLabel = (row) => {
    const parts = [row.name]
    const ta = formatTerritorialAuthority(row.territorialAuthority)
    if (ta) {
      parts.push(ta)
    } else if (row.majorName) {
      parts.push(row.majorName)
    } else if (row.type) {
      parts.push(row.type)
    } else {
      parts.push("New Zealand")
    }
    return parts.join(", ")
  }

  const suggestions = []
  for (const row of rows) {
    const label = buildLabel(row)
    suggestions.push([label, row.lat, row.lng, row.linzId])

    const labelKey = normalizeName(label)
    if (labelKey && !existingLookup.has(labelKey)) {
      existingLookup.set(labelKey, { lat: row.lat, lng: row.lng, linzId: row.linzId })
    }
  }

  const records = Array.from(existingLookup.entries()).map(([key, coords]) => {
    if (typeof coords?.linzId === "number") {
      return [key, coords.lat, coords.lng, coords.linzId]
    }
    return [key, coords.lat, coords.lng]
  })

  const jsonOutput = {
    source: "LINZ NZ Suburbs and Localities",
    generatedAt: new Date().toISOString(),
    count: records.length,
    records,
    suggestions,
  }

  await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true })
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(jsonOutput))

  console.log(`Wrote ${records.length} lookup entries to ${OUTPUT_JSON} (from SQL fallback)`)
}

const buildOutputs = async () => {
  let fields
  let maxRecordCount
  try {
    const fieldSet = await getFieldSet()
    fields = fieldSet.fields
    maxRecordCount = fieldSet.maxRecordCount
  } catch {
    console.warn("Falling back to SQL seed for localities because remote fetch failed.")
    await buildJsonFromSql()
    return
  }
  const desiredFields = [
    "OBJECTID",
    "name",
    "name_ascii",
    "additional_name",
    "additional_name_ascii",
    "major_name",
    "major_name_ascii",
    "major_name_type",
    "type",
    "territorial_authority",
    "population_estimate",
    "population",
    "shape__area",
  ]

  const outFields = desiredFields.filter((field) => fields.has(field)).join(",")
  if (!outFields.includes("name")) {
    throw new Error("Expected 'name' field not found in LINZ dataset")
  }

  const total = await getCount()
  const pageSize = Math.min(maxRecordCount, 2000)
  const features = []

  for (let offset = 0; offset < total; offset += pageSize) {
    console.log(`Fetching ${offset + 1}-${Math.min(offset + pageSize, total)} of ${total}`)
    const page = await fetchPage({ offset, count: pageSize, outFields })
    features.push(...page)
  }

  const lookup = new Map()
  const lookupMeta = new Map()
  const rows = []

  for (const feature of features) {
    const attributes = feature.attributes || {}
    const centroid = feature.centroid || feature.geometry
    if (!centroid || typeof centroid.x !== "number" || typeof centroid.y !== "number") {
      continue
    }

    const name = attributes.name
    if (!name) continue

    const linzId = Number(attributes.OBJECTID)
    if (!Number.isFinite(linzId)) continue

    const lat = round(centroid.y)
    const lng = round(centroid.x)

    const candidates = new Set()
    const nameCandidates = [
      name,
      attributes.name_ascii,
      ...splitAliases(attributes.additional_name),
      ...splitAliases(attributes.additional_name_ascii),
      attributes.major_name,
      attributes.major_name_ascii,
    ]

    for (const candidate of nameCandidates) {
      if (candidate && candidate.trim()) {
        candidates.add(candidate.trim())
      }
    }

    const aliasSet = new Map()
    for (const candidate of candidates) {
      const normalized = normalizeName(candidate)
      if (!normalized) continue

      aliasSet.set(normalized, candidate)

      const population =
        Number(attributes.population_estimate ?? attributes.population) || 0
      const area = Number(attributes.shape__area) || 0
      const importance = population * 1_000_000 + area

      const existing = lookupMeta.get(normalized)
      if (!existing || importance > existing.importance) {
        lookupMeta.set(normalized, { lat, lng, importance, linzId })
        lookup.set(normalized, { lat, lng, linzId })
      }
    }

    const aliases = [...aliasSet.values()].filter(
      (alias) => normalizeName(alias) !== normalizeName(name)
    )

    rows.push({
      linzId,
      name,
      type: attributes.type ?? null,
      majorName: attributes.major_name ?? null,
      majorNameType: attributes.major_name_type ?? null,
      territorialAuthority: attributes.territorial_authority ?? null,
      lat,
      lng,
      aliases,
    })
  }

  const buildLabel = (row) => {
    const parts = [row.name]
    const ta = formatTerritorialAuthority(row.territorialAuthority)
    if (ta) {
      parts.push(ta)
    } else if (row.majorName) {
      parts.push(row.majorName)
    } else if (row.type) {
      parts.push(row.type)
    } else {
      parts.push("New Zealand")
    }
    return parts.join(", ")
  }

  const suggestions = []
  for (const row of rows) {
    const label = buildLabel(row)
    suggestions.push([label, row.lat, row.lng, row.linzId])

    const labelKey = normalizeName(label)
    if (labelKey && !lookup.has(labelKey)) {
      lookup.set(labelKey, { lat: row.lat, lng: row.lng, linzId: row.linzId })
    }
  }

  const records = Array.from(lookup.entries()).map(([key, coords]) => {
    if (typeof coords?.linzId === "number") {
      return [key, coords.lat, coords.lng, coords.linzId]
    }
    return [key, coords.lat, coords.lng]
  })

  const jsonOutput = {
    source: "LINZ NZ Suburbs and Localities",
    generatedAt: new Date().toISOString(),
    count: records.length,
    records,
    suggestions,
  }

  const sqlLines = []
  sqlLines.push("-- Auto-generated: NZ localities (LINZ NZ Suburbs and Localities)")
  sqlLines.push(`-- Generated at: ${jsonOutput.generatedAt}`)
  sqlLines.push("")
  sqlLines.push("CREATE TABLE IF NOT EXISTS nz_localities (")
  sqlLines.push("  linz_id INTEGER PRIMARY KEY,")
  sqlLines.push("  name TEXT NOT NULL,")
  sqlLines.push("  type TEXT,")
  sqlLines.push("  major_name TEXT,")
  sqlLines.push("  major_name_type TEXT,")
  sqlLines.push("  territorial_authority TEXT,")
  sqlLines.push("  lat DOUBLE PRECISION NOT NULL,")
  sqlLines.push("  lng DOUBLE PRECISION NOT NULL,")
  sqlLines.push("  aliases TEXT[] DEFAULT ARRAY[]::TEXT[]")
  sqlLines.push(");")
  sqlLines.push("")
  sqlLines.push("CREATE INDEX IF NOT EXISTS nz_localities_name_idx ON nz_localities (name);")
  sqlLines.push(
    "CREATE INDEX IF NOT EXISTS nz_localities_aliases_gin_idx ON nz_localities USING GIN (aliases);"
  )
  sqlLines.push("")

  const chunkSize = 1000
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    sqlLines.push(
      "INSERT INTO nz_localities (linz_id, name, type, major_name, major_name_type, territorial_authority, lat, lng, aliases) VALUES"
    )

    chunk.forEach((row, index) => {
      const values = [
        row.linzId ?? "NULL",
        sqlEscape(row.name),
        sqlEscape(row.type),
        sqlEscape(row.majorName),
        sqlEscape(row.majorNameType),
        sqlEscape(row.territorialAuthority),
        row.lat,
        row.lng,
        sqlArray(row.aliases),
      ]

      const suffix = index === chunk.length - 1 ? ";" : ","
      sqlLines.push(`  (${values.join(", ")})${suffix}`)
    })

    sqlLines.push("")
  }

  await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true })
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(jsonOutput))

  await fs.mkdir(path.dirname(OUTPUT_SQL), { recursive: true })
  await fs.writeFile(OUTPUT_SQL, sqlLines.join("\n"))

  console.log(`Wrote ${records.length} lookup entries to ${OUTPUT_JSON}`)
  console.log(`Wrote ${rows.length} locality rows to ${OUTPUT_SQL}`)
}

buildOutputs().catch((error) => {
  console.error("Failed to build NZ localities:", error)
  process.exitCode = 1
})
