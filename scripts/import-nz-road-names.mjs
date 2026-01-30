#!/usr/bin/env node
/**
 * Import `supabase/seed/nz_road_names.csv` into local Supabase Postgres.
 *
 * Requires `psql` to be installed.
 *
 * Usage:
 *   node scripts/import-nz-road-names.mjs
 *
 * Env overrides:
 * - SUPABASE_DB_URL: Postgres connection string
 * - NZ_ROAD_NAMES_CSV: path to CSV file
 */

import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, "..")

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

const CSV_PATH = path.resolve(
  ROOT_DIR,
  process.env.NZ_ROAD_NAMES_CSV ?? "supabase/seed/nz_road_names.csv"
)

const run = (args, options) => {
  const res = spawnSync("psql", [DB_URL, ...args], {
    stdio: options?.stdio ?? "inherit",
    input: options?.input,
  })
  if (res.status !== 0) {
    process.exitCode = res.status ?? 1
    throw new Error(`psql failed with exit code ${res.status}`)
  }
}

const main = () => {
  run(["-c", "TRUNCATE public.nz_road_names RESTART IDENTITY;"])

  const csv = fs.readFileSync(CSV_PATH)
  // Avoid psql \copy path parsing/escaping edge cases by streaming the CSV over STDIN.
  // Header is included in the file, so we specify HEADER true.
  run(["-c", "COPY public.nz_road_names(road_name,locality_linz_id,locality_name,ta) FROM STDIN WITH (FORMAT csv, HEADER true);"], {
    stdio: ["pipe", "inherit", "inherit"],
    input: csv,
  })

  run(["-c", "select count(*) as nz_road_names_count from public.nz_road_names;"])
}

try {
  main()
} catch (error) {
  console.error("Failed to import nz_road_names:", error)
  process.exitCode = 1
}

