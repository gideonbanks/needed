/**
 * Shared utility functions for the provider module
 */

// NZ phone validation regex
const NZ_PHONE_REGEX = /^(?:0|\+?64)(?:[34679]\d{7}|2(?:1|2|7|8|9)\d{6,8}|800\d{5,6}|900\d{5,7})$/

/**
 * Remove formatting characters from phone number
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)\.]/g, "")
}

/**
 * Validate NZ phone number format
 */
export function validateNZPhone(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone)
  return NZ_PHONE_REGEX.test(cleaned)
}

/**
 * Format urgency level for display
 */
export function formatTimeNeed(timeNeed: string): string {
  switch (timeNeed) {
    case "now":
      return "URGENT"
    case "today":
      return "Today"
    case "this-week":
      return "This week"
    default:
      return timeNeed
  }
}

/**
 * Format a date as relative time (e.g., "5m ago", "2h ago")
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

/**
 * Get the first letter of a name as initial
 */
export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

/**
 * Get the first name from a full name
 */
export function getFirstName(name: string): string {
  return name.split(" ")[0] ?? name
}

/**
 * Get a consistent color index (0-5) based on a name
 */
export function getColorIndex(name: string): 0 | 1 | 2 | 3 | 4 | 5 {
  const sum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return (sum % 6) as 0 | 1 | 2 | 3 | 4 | 5
}
