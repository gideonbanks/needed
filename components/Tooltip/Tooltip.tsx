"use client"

import * as RadixTooltip from "@radix-ui/react-tooltip"
import { styled, Text } from "tamagui"

// Styled tooltip content using Tamagui
// Using tamagui package for React 19 compatibility
const TooltipContent = styled(RadixTooltip.Content, {
  name: "TooltipContent",
  borderRadius: "$2",
  backgroundColor: "$gray9", // Darkest grey
  color: "white",
  paddingHorizontal: "$4",
  paddingVertical: "$2.5",
  maxWidth: 200,
})

const TooltipArrow = styled(RadixTooltip.Arrow, {
  name: "TooltipArrow",
  fill: "$gray9",
  width: 16,
  height: 8,
})

export interface TooltipProps extends RadixTooltip.TooltipProps {
  explainer: React.ReactElement | string
  children: React.ReactElement
  className?: string
  withArrow?: boolean
  side?: "top" | "right" | "bottom" | "left"
}

export function Tooltip({
  children,
  explainer,
  open,
  defaultOpen,
  onOpenChange,
  side = "top",
  className,
  withArrow,
}: TooltipProps) {
  const content =
    typeof explainer === "string" ? (
      <Text fontFamily="$body" fontSize="$1" color="white">
        {explainer}
      </Text>
    ) : (
      explainer
    )

  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} delayDuration={200}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <TooltipContent side={side} sideOffset={5} className={className}>
            {content}
            {withArrow ? <TooltipArrow /> : null}
          </TooltipContent>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}
