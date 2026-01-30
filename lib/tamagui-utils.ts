import { styled } from "tamagui"

type StyledArgs = Parameters<typeof styled>

export function createNamedStyle(
  component: StyledArgs[0] | keyof React.JSX.IntrinsicElements,
  config: StyledArgs[1]
) {
  return styled(component as StyledArgs[0], config)
}
