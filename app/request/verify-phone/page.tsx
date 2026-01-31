"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { type ChangeEvent, type InputHTMLAttributes, Suspense, useEffect, useState } from "react"
import { Paragraph, styled, XStack, YStack } from "tamagui"
import { BackButton } from "components/BackButton/BackButton"
import { Button } from "components/Button/Button"
import {
  ContentContainer,
  Subtitle,
  Title,
} from "components/styled/request-flow"
import { readRequestDetailsFromSessionStorage, writeRequestDetailsToSessionStorage } from "lib/request/storage"
import { createNamedStyle } from "lib/tamagui-utils"
import { env } from "../../../env.mjs"

// Form-specific styled components
const FormField = styled(YStack, {
  name: "FormField",
  width: "100%",
  gap: "$2",
})

// Match the request details page input styling (Your street / Job details)
const NameInput = createNamedStyle("input", {
  name: "NameInput",
  width: "100%",
  minHeight: 48,
  fontSize: 18,
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$2",
  paddingHorizontal: "$4",
  backgroundColor: "$backgroundStrong",
  color: "$color",
  fontFamily: "$body",
  outline: "none",
  focusStyle: {
    borderColor: "$accent6",
    borderWidth: 2,
    boxShadow: "0 0 0 3px rgba(var(--color-accent-6-rgb), 0.1)",
  },
}) as React.ComponentType<InputHTMLAttributes<HTMLInputElement>>

const ErrorMessage = styled(Paragraph, {
  name: "ErrorMessage",
  fontSize: "$3",
  color: "$red9",
  marginTop: "$1",
  textAlign: "center",
})

function VerifyPhoneContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const service = searchParams.get("service")
  const time = searchParams.get("time")
  const suburb = searchParams.get("suburb")
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const detailsParam = searchParams.get("details")

  const [details, setDetails] = useState<string | null>(detailsParam)
  const [detailsLoaded, setDetailsLoaded] = useState(detailsParam !== null)

  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // If `NEXT_PUBLIC_ENABLE_MOCK_OTP` is explicitly set to `false`, env resolves it as `false`
  // and we do NOT fall back to a non-production default. Only when it's unset (undefined)
  // do we fall back to enabling mock OTP outside production.
  const allowMockOtp = env.NEXT_PUBLIC_ENABLE_MOCK_OTP ?? process.env.NODE_ENV !== "production"

  useEffect(() => {
    if (detailsParam) {
      setDetails(detailsParam)
      setDetailsLoaded(true)
      return
    }

    if (detailsLoaded) {
      return
    }

    const stored = readRequestDetailsFromSessionStorage()
    if (stored?.details) setDetails(stored.details)
    if (stored?.firstName) setFirstName(stored.firstName)
    if (stored?.lastName) setLastName(stored.lastName)

    setDetailsLoaded(true)
  }, [detailsParam, detailsLoaded])

  useEffect(() => {
    if (!service || !time || !suburb || !lat || !lng) {
      router.push("/request")
      return
    }

    if (!detailsLoaded) {
      return
    }

    if (!details) {
      router.push("/request")
    }
  }, [service, time, suburb, lat, lng, details, detailsLoaded, router])

  if (!service || !time || !suburb || !lat || !lng) {
    return null
  }

  if (!detailsLoaded || !details) {
    return null
  }

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      setError("Please enter your phone number")
      return
    }

    // NZ phone validation (landline, mobile, toll-free, premium)
    const phoneRegex = /^(?:0|\+?64)(?:[34679]\d{7}|2(?:1|2|7|8|9)\d{6,8}|800\d{5,6}|900\d{5,7})$/
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, "")

    if (!phoneRegex.test(cleanPhone)) {
      setError("Please enter a valid NZ phone number")
      return
    }

    if (!allowMockOtp) {
      setError("Phone verification isn't configured yet.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // TODO: Call Twilio Verify API to send OTP
      // For now, simulate OTP send
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setStep("otp")
    } catch (err) {
      console.error("Failed to send OTP:", err)
      setError("Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Clean phone and normalize to local NZ format (0xx...)
  const normalizePhone = (rawPhone: string): string => {
    const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, "")
    // Convert international +64xx to local 0xx
    if (cleaned.startsWith("+64")) {
      return "0" + cleaned.slice(3)
    }
    // Convert 64xx (without +) to local 0xx
    if (cleaned.startsWith("64") && cleaned.length > 2) {
      return "0" + cleaned.slice(2)
    }
    return cleaned
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code")
      return
    }

    if (!allowMockOtp) {
      setError("Phone verification isn't configured yet.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // TODO: Verify OTP with Twilio
      // For now, simulate verification
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In mock mode, accept a specific test code for predictable testing
      const MOCK_VALID_CODE = "123456"
      if (allowMockOtp && otp !== MOCK_VALID_CODE) {
        throw new Error("Invalid code")
      }

      const normalizedPhone = normalizePhone(phone)

      try {
        writeRequestDetailsToSessionStorage({ details, phone: normalizedPhone })
      } catch {
        // Ignore storage access errors (e.g., private browsing mode)
        if (process.env.NODE_ENV !== "production") {
          console.warn("Session storage write failed (possibly private browsing)")
        }
      }

      // Next step: collect name before sending.
      setStep("name")
    } catch (err) {
      console.error("Failed to verify OTP:", err)
      setError("Invalid code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleContinueWithName = () => {
    const first = firstName.trim()
    const last = lastName.trim()

    if (!first || !last) {
      setError("Please enter your first and last name")
      return
    }

    const normalizedPhone = normalizePhone(phone)

    try {
      writeRequestDetailsToSessionStorage({ details, phone: normalizedPhone, firstName: first, lastName: last })
    } catch {
      // Ignore storage access errors (e.g., private browsing mode)
      if (process.env.NODE_ENV !== "production") {
        console.warn("Session storage write failed (possibly private browsing)")
      }
    }

    router.push(
      `/request/sending?service=${service}&time=${time}&suburb=${encodeURIComponent(suburb)}&lat=${lat}&lng=${lng}`
    )
  }

  return (
    <>
      <BackButton
        onClick={() => {
          // Persist draft so users can edit when they go back.
          writeRequestDetailsToSessionStorage({
            service,
            time,
            suburb,
            details,
            lat: lat ? Number.parseFloat(lat) : null,
            lng: lng ? Number.parseFloat(lng) : null,
          })
          router.push(
            `/request/details?service=${service}&time=${time}&suburb=${encodeURIComponent(suburb)}&lat=${lat}&lng=${lng}&details=${encodeURIComponent(details)}`
          )
        }}
      />
      <ContentContainer>
        <Title>{step === "name" ? "What is your name?" : "Confirm your number"}</Title>
        <Subtitle marginBottom="$6">
          We'll only use this so pros can contact you about this request.
        </Subtitle>

        {step === "phone" ? (
          <>
            <FormField>
              <NameInput
                id="request-phone"
                type="tel"
                placeholder="021 123 4567"
                value={phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                style={{ textAlign: "center" }}
                autoFocus
              />
              {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            </FormField>

            <Button
              onClick={handleSendOTP}
              size="lg"
              width="100%"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send code"}
            </Button>
          </>
        ) : step === "otp" ? (
          <>
            <FormField>
              <NameInput
                id="request-otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={{ textAlign: "center" }}
                autoFocus
                maxLength={6}
              />
              {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            </FormField>

            <YStack width="100%">
              <Button
                onClick={handleVerifyOTP}
                size="lg"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify & Send"}
              </Button>
            </YStack>

            <YStack marginTop="$2">
              <Button
                intent="secondary"
                size="sm"
                onClick={() => {
                  setStep("phone")
                  setOtp("")
                  setError("")
                }}
              >
                Change number
              </Button>
            </YStack>
          </>
        ) : (
          <>
            <XStack
              width="100%"
              gap="$3"
              flexDirection="column"
              $gtSm={{ flexDirection: "row" }}
            >
              <FormField flex={1}>
                <NameInput
                  id="request-first-name"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                  style={{ fontFamily: "inherit" }}
                  autoFocus
                />
              </FormField>
              <FormField flex={1}>
                <NameInput
                  id="request-last-name"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                  style={{ fontFamily: "inherit" }}
                />
                {error ? <ErrorMessage>{error}</ErrorMessage> : null}
              </FormField>
            </XStack>

            <Button
              onClick={handleContinueWithName}
              size="lg"
              width="100%"
              disabled={loading}
            >
              Send request
            </Button>
          </>
        )}
      </ContentContainer>
    </>
  )
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<Paragraph>Loading...</Paragraph>}>
      <VerifyPhoneContent />
    </Suspense>
  )
}
