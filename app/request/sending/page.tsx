"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { Paragraph, styled } from "tamagui"
import { BackButton } from "components/BackButton/BackButton"
import { Button } from "components/Button/Button"
import {
  ContentContainer,
  Subtitle,
  Title,
} from "components/styled/request-flow"
import { getRequestSendTokenStorageKey, REQUEST_DETAILS_STORAGE_KEY } from "lib/request/constants"
import { readRequestDetailsFromSessionStorage } from "lib/request/storage"

const ErrorMessage = styled(Paragraph, {
  name: "ErrorMessage",
  fontSize: "$4",
  color: "$red9",
  textAlign: "center",
})

const FETCH_TIMEOUT_MS = 30_000

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS
) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function SendingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const service = searchParams.get("service")
  const time = searchParams.get("time")
  const suburb = searchParams.get("suburb")
  const detailsParam = searchParams.get("details")
  const phoneParam = searchParams.get("phone")
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  const [details, setDetails] = useState<string | null>(detailsParam)
  const [phone, setPhone] = useState<string | null>(phoneParam)
  const [detailsLoaded, setDetailsLoaded] = useState(
    !!detailsParam || !!phoneParam
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (detailsParam || phoneParam) {
      setDetailsLoaded(true)
      return
    }

    if (detailsLoaded) {
      return
    }

    const stored = readRequestDetailsFromSessionStorage()
    if (stored?.details) setDetails(stored.details)
    if (stored?.phone) setPhone(stored.phone)
    setDetailsLoaded(true)
  }, [detailsParam, phoneParam, detailsLoaded])

  const hasSubmittedRef = useRef(false)

  useEffect(() => {
    if (!detailsLoaded) {
      return
    }

    if (!service || !time || !suburb || !phone || !lat || !lng) {
      router.push("/request")
      return
    }

    if (!details) {
      router.push("/request")
      return
    }

    if (hasSubmittedRef.current) {
      return
    }
    hasSubmittedRef.current = true

    // Create request in Supabase
    const createRequest = async () => {
      try {
        setError(null)
        const latNum = Number.parseFloat(lat)
        const lngNum = Number.parseFloat(lng)
        const hasValidCoords =
          Number.isFinite(latNum) &&
          Number.isFinite(lngNum) &&
          latNum >= -90 &&
          latNum <= 90 &&
          lngNum >= -180 &&
          lngNum <= 180

        if (!hasValidCoords) {
          setError("We couldn't verify your location. Please go back and try again.")
          return
        }

        // Create request via API
        const response = await fetchWithTimeout("/api/request/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceSlug: service,
            timeNeed: time,
            suburb,
            lat: latNum,
            lng: lngNum,
            details,
            phone,
          }),
        })
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Too many requests. Please wait a moment and try again.")
          }
          let errorMsg = "Failed to create request"
          try {
            const data = (await response.json()) as { error?: string }
            if (data.error) errorMsg = data.error
          } catch {
            // Ignore JSON parse errors for error responses
          }
          throw new Error(errorMsg)
        }

        let data: { error?: string; requestId?: string; sendToken?: string }
        try {
          data = await response.json()
        } catch {
          throw new Error("Failed to create request")
        }

        if (!data.sendToken || typeof data.sendToken !== "string") {
          throw new Error("Missing send token")
        }

        if (!data.requestId || typeof data.requestId !== "string") {
          throw new Error("Missing request id")
        }

        // Store token for potential re-send from the status screen.
        try {
          sessionStorage.setItem(getRequestSendTokenStorageKey(data.requestId), data.sendToken)
        } catch {
          // Ignore storage access errors
        }

        // Send request to providers
        const sendResponse = await fetchWithTimeout("/api/request/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: data.requestId,
            sendToken: data.sendToken,
          }),
        })
        let sendData: { error?: string }
        try {
          sendData = await sendResponse.json()
        } catch {
          throw new Error("Failed to send request")
        }

        if (!sendResponse.ok) {
          throw new Error(sendData.error || "Failed to send request")
        }

        try {
          sessionStorage.removeItem(REQUEST_DETAILS_STORAGE_KEY)
        } catch {
          // Ignore storage access errors
        }

        // Navigate to status page
        router.push(`/request/status/${data.requestId}`)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setError("Request timed out. Please check your connection and try again.")
          hasSubmittedRef.current = false
          return
        }
        console.error("Failed to create/send request:", error)
        setError(error instanceof Error ? error.message : "Failed to send request. Please try again.")
        hasSubmittedRef.current = false
      }
    }

    createRequest()
  }, [details, detailsLoaded, router, service, time, suburb, phone, lat, lng])

  if (
    !service ||
    !time ||
    !suburb ||
    !phone ||
    !lat ||
    !lng ||
    !detailsLoaded ||
    !details
  ) {
    return null
  }

  return (
    <>
      <BackButton
        onClick={() => {
          const params = new URLSearchParams({
            service,
            time,
            suburb,
            lat,
            lng,
          })
          router.push(
            `/request/verify-phone?${params.toString()}`
          )
        }}
      />
      <ContentContainer>
        <Title>{error ? "Something went wrong" : "Sending your request…"}</Title>
        {error ? (
          <>
            <ErrorMessage>{error}</ErrorMessage>
            <Button
              intent="secondary"
              size="sm"
              onClick={() => router.push("/request")}
            >
              Back to request
            </Button>
          </>
        ) : (
          <>
            <Subtitle>This usually takes under a minute.</Subtitle>
            <div className="needed-spinner" role="status" aria-label="Loading" />
          </>
        )}
      </ContentContainer>
    </>
  )
}

export default function SendingPage() {
  return (
    <Suspense
      fallback={
        <ContentContainer>
          <Title>Loading...</Title>
        </ContentContainer>
      }
    >
      <SendingContent />
    </Suspense>
  )
}
