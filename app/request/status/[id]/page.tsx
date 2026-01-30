"use client"

import type { Route } from "next"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Paragraph, styled, YStack } from "tamagui"
import { BackButton } from "components/BackButton/BackButton"
import { Button } from "components/Button/Button"
import {
  ContentContainer,
  Subtitle,
  Title,
} from "components/styled/request-flow"
import { getRequestSendTokenStorageKey } from "lib/request/constants"

const InfoText = styled(Paragraph, {
  name: "InfoText",
  fontSize: "$4",
  color: "$colorSecondary", // gray8 in light theme, white in dark theme
  textAlign: "center",
  marginBottom: "$2",
})

const TimerText = styled(Paragraph, {
  name: "TimerText",
  fontSize: "$3",
  color: "$colorSecondary", // gray8 in light theme, white in dark theme
  textAlign: "center",
  marginTop: "$4",
  fontFamily: "monospace",
})

const ButtonGroup = styled(YStack, {
  name: "ButtonGroup",
  width: "100%",
  gap: "$3",
  marginTop: "$6",
})

type RequestStatus = "waiting" | "no-reply" | "re-sent" | "contacted"

export default function RequestStatusPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = Array.isArray(params.id) ? params.id[0] : params.id

  const [status, setStatus] = useState<RequestStatus>("waiting")
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [providerCount, setProviderCount] = useState(3) // TODO: Get from API

  const statusRef = useRef(status)
  statusRef.current = status

  useEffect(() => {
    if (!requestId) {
      router.push("/request")
    }
  }, [requestId, router])

  useEffect(() => {
    if (!requestId) {
      return
    }

    // Timer for 10-minute countdown
    const interval = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1
        // Check if 10 minutes (600 seconds) have passed
        if (newTime >= 600 && statusRef.current === "waiting") {
          setStatus("no-reply")
        }
        return newTime
      })
    }, 1000)

    // TODO: Poll Supabase for request status updates
    // Check if any provider has contacted

    return () => clearInterval(interval)
  }, [requestId])

  if (!requestId) {
    return null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleResend = async (id: string) => {
    let sendToken: string | null = null
    try {
      sendToken = sessionStorage.getItem(getRequestSendTokenStorageKey(id))
    } catch {
      // Ignore storage access errors
    }

    if (!sendToken) {
      // We currently rely on the send token for authorization. If it's missing, route user back
      // to the request flow to create a fresh request instead of failing silently.
      router.push("/request")
      return
    }

    const response = await fetch("/api/request/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, sendToken }),
    })

    let data: { error?: string; providerCount?: number } = {}
    try {
      data = (await response.json()) as { error?: string; providerCount?: number }
    } catch {
      // ignore
    }

    if (!response.ok) {
      console.error("Failed to resend request:", data.error || "Unknown error")
      return
    }

    if (typeof data.providerCount === "number") {
      setProviderCount(data.providerCount)
    }
    setStatus("re-sent")
    setTimeElapsed(0)
  }

  const handleEdit = () => {
    router.push("/request")
  }

  const handleCancel = async (id: string) => {
    // TODO: Call API to cancel request with requestId
    void id
    router.push("/request")
  }

  const handleSorted = async (id: string) => {
    // TODO: Mark request as sorted with requestId
    void id
    // TODO: Remove cast once `/request/sorted` route is defined in typed routes.
    router.push("/request/sorted" as Route)
  }

  if (status === "waiting") {
    const timeRemaining = Math.max(0, 600 - timeElapsed)
    const canResend = timeRemaining === 0

    return (
      <>
        <BackButton href="/request" />
        <ContentContainer>
          <Title>Request sent</Title>
          <Subtitle marginBottom="$4">You should hear back within 10 minutes.</Subtitle>

          <InfoText>
            We've notified {providerCount} available {providerCount === 1 ? "pro" : "pros"}
            {providerCount < 3 && " (limited availability in your area)"}.
          </InfoText>
          <InfoText>They'll call or text you directly.</InfoText>

          {timeRemaining > 0 && (
            <TimerText>
              If you don't hear back by {formatTime(timeRemaining)}, re-send.
            </TimerText>
          )}

          <ButtonGroup>
            <Button
              onClick={() => handleResend(requestId)}
              disabled={!canResend}
              size="lg"
              style={{ width: "100%" }}
            >
              {canResend ? "Re-send to 3 more" : `Re-send (available in ${formatTime(timeRemaining)})`}
            </Button>
            <Button
              onClick={handleEdit}
              intent="secondary"
              size="sm"
              style={{ width: "100%" }}
            >
              Edit request
            </Button>
            <Button
              onClick={() => handleCancel(requestId)}
              intent="secondary"
              size="sm"
              style={{ width: "100%" }}
            >
              Cancel request
            </Button>
          </ButtonGroup>
        </ContentContainer>
      </>
    )
  }

  if (status === "no-reply") {
    return (
      <>
        <BackButton href="/request" />
        <ContentContainer>
          <Title>No reply yet</Title>
          <Subtitle marginBottom="$4">Want us to send this to 3 more pros?</Subtitle>

          <ButtonGroup>
            <Button
              onClick={() => handleResend(requestId)}
              size="lg"
              style={{ width: "100%" }}
            >
              Re-send to 3 more
            </Button>
            <Button
              onClick={handleEdit}
              intent="secondary"
              size="sm"
              style={{ width: "100%" }}
            >
              Edit request
            </Button>
            <Button
              onClick={() => handleCancel(requestId)}
              intent="secondary"
              size="sm"
              style={{ width: "100%" }}
            >
              Cancel request
            </Button>
          </ButtonGroup>
        </ContentContainer>
      </>
    )
  }

  if (status === "re-sent") {
    return (
      <>
        <BackButton href="/request" />
        <ContentContainer>
          <Title>Sent to 3 more pros</Title>
          <Subtitle marginBottom="$4">You should hear back soon.</Subtitle>
          <InfoText>
            This page won&apos;t update automatically yet. If a pro contacts you, you can return here later.
          </InfoText>
          <ButtonGroup>
            <Button
              onClick={() => handleCancel(requestId)}
              intent="secondary"
              size="sm"
              style={{ width: "100%" }}
            >
              Cancel request
            </Button>
          </ButtonGroup>
        </ContentContainer>
      </>
    )
  }

  // Contacted state
  return (
    <>
      <BackButton href="/request" />
      <ContentContainer>
        <Title>All sorted?</Title>
        <ButtonGroup>
          <Button
            onClick={() => handleSorted(requestId)}
            size="lg"
            style={{ width: "100%" }}
          >
            Yes, sorted
          </Button>
          <Button
            onClick={() => handleResend(requestId)}
            intent="secondary"
            size="sm"
            style={{ width: "100%" }}
          >
            Not yet
          </Button>
        </ButtonGroup>
      </ContentContainer>
    </>
  )
}
