import type { KeyboardEvent } from "react"

export function isActivationKey(event: KeyboardEvent<HTMLElement>) {
  return event.key === "Enter" || event.key === " "
}

export function handleKeyActivate(
  event: KeyboardEvent<HTMLElement>,
  onActivate: () => void
) {
  if (!isActivationKey(event)) return
  event.preventDefault()
  onActivate()
}

export function handleKeyClick(event: KeyboardEvent<HTMLElement>) {
  handleKeyActivate(event, () => {
    ;(event.currentTarget as HTMLElement).click()
  })
}

