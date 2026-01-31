"use client"

import type { InputHTMLAttributes } from "react"
import { Paragraph, styled, YStack } from "tamagui"
import { createNamedStyle } from "lib/tamagui-utils"

/**
 * Styled form field wrapper with consistent spacing
 */
export const FormField = styled(YStack, {
  name: "FormField",
  width: "100%",
  gap: "$2",
})

/**
 * Form field label
 */
export const Label = styled(Paragraph, {
  name: "Label",
  fontSize: "$3",
  fontWeight: "600",
  color: "$color",
})

/**
 * Standard text input with consistent styling
 */
export const StyledInput = createNamedStyle("input", {
  name: "StyledInput",
  width: "100%",
  minHeight: 48,
  fontSize: "$4",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$2",
  paddingHorizontal: "$4",
  backgroundColor: "$background",
  fontFamily: "$body",
  outline: "none",
  focusStyle: {
    borderColor: "$accent6",
    borderWidth: 2,
    boxShadow: "0 0 0 3px rgba(1, 164, 147, 0.1)",
  },
}) as React.ComponentType<InputHTMLAttributes<HTMLInputElement>>

/**
 * OTP code input with larger text and letter spacing
 */
export const OTPInput = createNamedStyle("input", {
  name: "OTPInput",
  width: "100%",
  minHeight: 48,
  fontSize: "$6",
  borderWidth: 1,
  borderColor: "$gray4",
  borderRadius: "$2",
  paddingHorizontal: "$4",
  backgroundColor: "$background",
  letterSpacing: "$2",
  fontWeight: "600",
  fontFamily: "$body",
  outline: "none",
  focusStyle: {
    borderColor: "$accent6",
    borderWidth: 2,
    boxShadow: "0 0 0 3px rgba(1, 164, 147, 0.1)",
  },
}) as React.ComponentType<InputHTMLAttributes<HTMLInputElement>>

/**
 * Error message display for forms
 */
export const ErrorMessage = styled(Paragraph, {
  name: "ErrorMessage",
  fontSize: "$3",
  color: "$red9",
  marginTop: "$1",
  textAlign: "center",
})
