/**
 * Shared constants for the provider module
 */

/**
 * Trade services that have higher pricing
 */
export const TRADE_SERVICES = ["plumber", "electrician", "locksmith", "gasfitter"]

/**
 * Base rate: dollars per credit
 */
export const DOLLARS_PER_CREDIT = 1.00

/**
 * Credit pricing matrix by service category and urgency
 * Trade services (plumber, electrician, locksmith): $25–$50 per contact
 * General services (movers, carpet cleaning, rubbish removal): $15–$30 per contact
 */
export const PRICING_MATRIX: Record<"trade" | "general", Record<"now" | "today" | "this-week", number>> = {
  trade: {
    "now": 50,      // $50 - urgent trade work (max)
    "today": 35,    // $35 - same day trade
    "this-week": 25 // $25 - flexible trade
  },
  general: {
    "now": 30,      // $30 - urgent general
    "today": 20,    // $20 - same day general
    "this-week": 15 // $15 - flexible general
  }
}

/**
 * Credit pack definitions for purchase
 */
export const CREDIT_PACKS = [
  {
    id: "starter",
    credits: 50,
    responses: 2,
    pricePerCredit: 1.00,
    discount: 0,
    badge: null,
  },
  {
    id: "standard",
    credits: 150,
    responses: 5,
    pricePerCredit: 0.95,
    discount: 5,
    badge: "5% OFF",
  },
  {
    id: "pro",
    credits: 300,
    responses: 10,
    pricePerCredit: 0.90,
    discount: 10,
    badge: "10% OFF",
  },
  {
    id: "business",
    credits: 600,
    responses: 20,
    pricePerCredit: 0.85,
    discount: 15,
    badge: "BEST VALUE",
    highlighted: true,
  },
] as const

export type CreditPack = typeof CREDIT_PACKS[number]

/**
 * Calculate credit cost for a job based on service and urgency
 */
export function calculateCreditCost(serviceSlug: string, urgency: "now" | "today" | "this-week"): number {
  const category = TRADE_SERVICES.includes(serviceSlug.toLowerCase()) ? "trade" : "general"
  return PRICING_MATRIX[category][urgency]
}

/**
 * Format credits with dollar equivalent
 */
export function formatCreditsWithDollars(credits: number): string {
  const dollars = credits * DOLLARS_PER_CREDIT
  const dollarStr = dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
  return `${credits} Credits (${dollarStr})`
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}
