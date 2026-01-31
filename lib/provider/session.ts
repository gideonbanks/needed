import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { env } from "../../env.mjs"

const TOKEN_VERSION = 1
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const COOKIE_NAME = "provider_session"

type ProviderTokenPayload = {
  v: number
  pid: string // provider ID
  exp: number
}

const isProviderTokenPayload = (value: unknown): value is ProviderTokenPayload =>
  typeof value === "object" &&
  value !== null &&
  "v" in value &&
  "pid" in value &&
  "exp" in value &&
  (value as ProviderTokenPayload).v === TOKEN_VERSION &&
  typeof (value as ProviderTokenPayload).pid === "string" &&
  typeof (value as ProviderTokenPayload).exp === "number"

const base64UrlEncode = (value: string) =>
  Buffer.from(value, "utf8").toString("base64url")

const base64UrlDecode = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8")

function getSecret(): string {
  const secret = env.REQUEST_SEND_TOKEN_SECRET
  if (!secret) {
    throw new Error("REQUEST_SEND_TOKEN_SECRET is not configured")
  }
  return secret
}

export function createProviderToken(
  providerId: string,
  nowMs = Date.now()
): string {
  const secret = getSecret()
  const payload: ProviderTokenPayload = {
    v: TOKEN_VERSION,
    pid: providerId,
    exp: nowMs + SESSION_TTL_MS,
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url")

  return `${encodedPayload}.${signature}`
}

export function verifyProviderToken(
  token: string,
  nowMs = Date.now()
): { valid: false; error: string } | { valid: true; providerId: string } {
  const secret = getSecret()
  const parts = token.split(".")

  if (parts.length !== 2) {
    return { valid: false, error: "Invalid token format" }
  }

  const [encodedPayload, signature] = parts
  if (!encodedPayload || !signature) {
    return { valid: false, error: "Invalid token format" }
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url")

  const expectedBuffer = Buffer.from(expectedSignature, "utf8")
  const signatureBuffer = Buffer.from(signature, "utf8")

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return { valid: false, error: "Invalid token signature" }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(base64UrlDecode(encodedPayload))
  } catch {
    return { valid: false, error: "Invalid token payload" }
  }

  if (!isProviderTokenPayload(parsed)) {
    return { valid: false, error: "Invalid token payload" }
  }

  if (parsed.exp <= nowMs) {
    return { valid: false, error: "Token expired" }
  }

  return { valid: true, providerId: parsed.pid }
}

export async function setProviderSession(providerId: string): Promise<void> {
  const token = createProviderToken(providerId)
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  })
}

export async function getProviderSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const result = verifyProviderToken(token)
  if (!result.valid) {
    return null
  }

  return result.providerId
}

export async function clearProviderSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
