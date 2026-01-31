"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ChangeEvent, useState } from "react"
import { Paragraph, YStack } from "tamagui"
import { Button } from "components/Button/Button"
import {
  ContentContainer,
  Subtitle,
  Title,
} from "components/styled/request-flow"
import {
  AuthInput,
  ErrorMessage,
  FormField,
} from "lib/provider/form-components"
import { cleanPhoneNumber, validateNZPhone } from "lib/provider/utils"

export default function ProviderSignupPage() {
  const router = useRouter()

  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      setError("Please enter your phone number")
      return
    }

    const cleanPhone = cleanPhoneNumber(phone)

    if (!validateNZPhone(cleanPhone)) {
      setError("Please enter a valid NZ phone number")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/provider/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP")
      }

      setStep("otp")
    } catch (err) {
      console.error("Failed to send OTP:", err)
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code")
      return
    }

    setLoading(true)
    setError("")

    const cleanPhone = cleanPhoneNumber(phone)

    try {
      const response = await fetch("/api/provider/auth/verify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP")
      }

      router.push("/provider/onboarding")
    } catch (err) {
      console.error("Failed to verify OTP:", err)
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChangeNumber = () => {
    setStep("phone")
    setOtp("")
    setError("")
  }

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$4"
      minHeight="100vh"
    >
      <ContentContainer>
        <Title>Become a Provider</Title>
        <Subtitle marginBottom="$6">
          Sign up to receive job leads from customers in your area.
        </Subtitle>

        {step === "phone" ? (
          <>
            <FormField>
              <AuthInput
                id="provider-phone"
                type="tel"
                placeholder="021 123 4567"
                value={phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                style={{ textAlign: "center", fontFamily: "inherit" }}
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

            <YStack marginTop="$4" alignItems="center">
              <Paragraph fontSize="$3" color="$colorSecondary">
                Already have an account?{" "}
                <Link href="/login" style={{ color: "inherit", fontWeight: 600 }}>
                  Log in
                </Link>
              </Paragraph>
            </YStack>
          </>
        ) : (
          <>
            <FormField>
              <AuthInput
                id="provider-otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={{ textAlign: "center", fontFamily: "inherit" }}
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
                {loading ? "Verifying..." : "Continue"}
              </Button>
            </YStack>

            <YStack marginTop="$2">
              <Button
                intent="secondary"
                size="sm"
                onClick={handleChangeNumber}
              >
                Change number
              </Button>
            </YStack>
          </>
        )}
      </ContentContainer>
    </YStack>
  )
}
