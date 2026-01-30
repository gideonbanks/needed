import Image from "next/image"
import type { CSSProperties } from "react"

const LOGO_SOURCES = {
  light: "/Needed-Logo.svg",
  dark: "/Needed-Logo-Wt.svg",
} as const

const LOGO_DIMENSIONS = { width: 120, height: 32 }

export function LogoImage({
  variant,
  priority,
  style,
}: {
  variant: keyof typeof LOGO_SOURCES
  priority?: boolean
  style?: CSSProperties
}) {
  return (
    <Image
      src={LOGO_SOURCES[variant]}
      alt="Needed"
      {...LOGO_DIMENSIONS}
      priority={priority}
      style={style}
    />
  )
}
