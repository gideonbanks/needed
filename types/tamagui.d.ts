import type { Conf } from "../tamagui.config"
import type { KeyboardEvent } from "react"
import "tamagui"
import "@tamagui/web"

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends Conf {}

  interface MediaQueries {
    xl: boolean
    lg: boolean
    md: boolean
    sm: boolean
    xs: boolean
    xxs: boolean
    gtXs: boolean
    gtSm: boolean
    gtMd: boolean
    gtLg: boolean
    gtXl: boolean
  }

  interface RNTamaguiViewNonStyleProps {
    onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
  }
}

declare module "@tamagui/web" {
  interface StackStyleBase {
    [key: `@${string}`]: any
  }

  interface TextStylePropsBase {
    [key: `@${string}`]: any
  }
}

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}

export {}
