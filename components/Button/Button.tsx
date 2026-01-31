"use client"

import { Children, cloneElement, isValidElement, useState } from "react"
import type { CSSProperties, MouseEvent, ReactNode } from "react"
import { type GetProps, styled, Button as TamaguiButton, Text } from "tamagui"

// Styled Button component using Tamagui
// Using tamagui package instead of @tamagui/core for React 19 compatibility
const StyledButton = styled(TamaguiButton, {
  name: "Button",
  borderRadius: "$2", // Smaller radius
  borderWidth: 1,
  borderColor: "$primary7",
  cursor: "pointer",
  // Don't set fontFamily here - it triggers Tamagui's font size resolution
  // Font family is set on Text children directly with explicit fontSize tokens
  fontWeight: "500",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "$2",

  variants: {
    intent: {
      primary: {
        backgroundColor: "$accent6",
        borderColor: "$accent6",
        hoverStyle: {
          backgroundColor: "$primary7",
        },
        pressStyle: {
          backgroundColor: "$primary8",
        },
      },
      secondary: {
        backgroundColor: "transparent",
        borderColor: "$borderColor",
        hoverStyle: {
          backgroundColor: "$primary7",
          borderColor: "$primary7",
        },
        pressStyle: {
          backgroundColor: "$primary7",
          borderColor: "$primary7",
        },
      },
      accent: {
        backgroundColor: "$accent6", // #01a493
        borderColor: "$accent6",
        hoverStyle: {
          backgroundColor: "$accent7",
        },
        pressStyle: {
          backgroundColor: "$accent8",
        },
      },
    },
    size: {
      sm: {
        minWidth: 80,
        height: 40,
        paddingHorizontal: "$4",
        paddingVertical: "$2",
        fontSize: "$3",
        // Don't set fontFamily here - it's set on Text children to avoid Tamagui font size resolution
      },
      lg: {
        minWidth: 128,
        height: 48,
        paddingHorizontal: "$6",
        paddingVertical: "$3",
        fontSize: "$5",
        // Don't set fontFamily here - it's set on Text children to avoid Tamagui font size resolution
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: "not-allowed",
        pointerEvents: "none",
      },
  },
  } as const,
})

type StyledButtonProps = GetProps<typeof StyledButton>

export interface ButtonProps extends Omit<StyledButtonProps, "intent" | "size" | "children" | "onPress"> {
  intent?: "primary" | "secondary" | "accent"
  size?: "sm" | "lg"
  underline?: boolean
  href?: string
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  disabled?: boolean
  target?: string
  rel?: string
  style?: CSSProperties
  width?: string | number
  marginTop?: string | number
  children?: ReactNode
}

export function Button({
  href,
  intent = "primary",
  size = "lg",
  underline = false,
  children,
  onClick,
  disabled,
  target,
  rel,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isExternal = typeof href === "string" && /^https?:\/\//.test(href)
  const resolvedTarget = target ?? (isExternal ? "_blank" : undefined)
  const resolvedRel = rel ?? (isExternal ? "noopener noreferrer" : undefined)

  const buttonClassName = intent === "secondary" ? "button-secondary" : intent === "primary" ? "button-primary" : undefined
  // Use numeric token references directly to avoid Tamagui font size resolution issues
  // These map to the same values: sm -> $3 (36px), lg -> $5 (52px)
  const buttonFontSize = size === "lg" ? "$5" : "$3"

  // Process children to pass color to icon components
  const processChildrenWithColor = (children: ReactNode, color: string) => {
    return Children.map(children, (child) => {
      if (isValidElement(child) && typeof child.type !== "string") {
        // Clone non-string elements (icons, etc.) and pass color prop
        return cloneElement(child as React.ReactElement<{ color?: string }>, { color })
      }
      return child
    })
  }

  const secondaryIconColor = isHovered ? "white" : "$color"

  const childrenWithColor = intent === "secondary" ? (
    <Text
      fontFamily="$body"
      fontSize={buttonFontSize}
      color={isHovered ? "white" : "$color"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "color 0.2s ease",
        textDecorationLine: underline ? "underline" : undefined,
      }}
    >
      {processChildrenWithColor(children, secondaryIconColor)}
    </Text>
  ) : intent === "primary" || intent === "accent" ? (
    <Text
      fontFamily="$body"
      color="white"
      fontSize={buttonFontSize}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        textDecorationLine: underline ? "underline" : undefined,
      }}
    >
      {children}
    </Text>
  ) : (
    children
  )

  const handleHoverIn = () => {
    if (intent === "secondary") {
      setIsHovered(true)
    }
  }

  const handleHoverOut = () => {
    if (intent === "secondary") {
      setIsHovered(false)
    }
  }

  type AnchorButtonProps = StyledButtonProps & {
    as: "a"
    href: string
    target?: string
    rel?: string
  }

  // Tamagui's `onPress` is typed like React Native, but on web it behaves like a click.
  // Keep the public `onClick` type narrow while adapting at this boundary.
  const onPress: StyledButtonProps["onPress"] | undefined = onClick
    ? ((event) => {
        onClick(event as unknown as MouseEvent<HTMLButtonElement | HTMLAnchorElement>)
      })
    : undefined

  const sharedProps = {
    intent,
    size,
    onPress,
    disabled,
    onHoverIn: handleHoverIn,
    onHoverOut: handleHoverOut,
    className: buttonClassName,
    ...props,
  } satisfies StyledButtonProps

  const buttonElement = href ? (
    <StyledButton
      {...({
        ...sharedProps,
        as: "a",
        href,
        target: resolvedTarget,
        rel: resolvedRel,
      } satisfies AnchorButtonProps)}
    >
      {childrenWithColor}
    </StyledButton>
  ) : (
    <StyledButton {...sharedProps}>
      {childrenWithColor}
    </StyledButton>
  )

  return buttonElement
}
