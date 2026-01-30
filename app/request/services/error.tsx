"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface the real error in the browser console.
    console.error(error)
    if (process.env.NODE_ENV === "production") {
      // TODO: Report to error monitoring service in production
      // e.g. Sentry.captureException(error)
    }
  }, [error])

  return (
    <div style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        Couldn’t load services
      </h1>
      <p style={{ marginBottom: "1rem", color: "#4b5563" }}>
        This page reads from the Supabase <code>services</code> table. If it isn’t created yet (or env vars
        aren’t set), Supabase will return an error.
      </p>

      <div
        style={{
          padding: "1rem",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          marginBottom: "1rem",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 13,
          whiteSpace: "pre-wrap",
        }}
      >
        {error.message}
        {error.digest ? (
          <div style={{ marginTop: "0.5rem", color: "#6b7280" }}>
            Digest: {error.digest}
          </div>
        ) : null}
      </div>

      <ul style={{ marginBottom: "1rem", paddingLeft: "1.25rem", color: "#374151" }}>
        <li>
          Create + seed the <code>services</code> table from <code>SUPABASE_SETUP.md</code>
        </li>
        <li>
          Ensure <code>.env.local</code> has <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then restart <code>pnpm dev</code>
        </li>
        <li>
          Use the <Link href="/test-supabase">/test-supabase</Link> page to confirm your connection
        </li>
      </ul>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.6rem 0.9rem",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Retry
        </button>
        <Link href="/" style={{ color: "#2563eb", textDecoration: "underline" }}>
          Go home
        </Link>
      </div>
    </div>
  )
}

