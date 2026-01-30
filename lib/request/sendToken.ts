import { createHmac, timingSafeEqual } from "crypto"

const TOKEN_VERSION = 1
// Must outlive the "re-send after 10 minutes" UX.
export const SEND_TOKEN_TTL_MS = 30 * 60 * 1000

type SendTokenPayload = {
  v: number
  rid: string
  cid: string
  exp: number
}

const isSendTokenPayload = (value: unknown): value is SendTokenPayload =>
  typeof value === "object" &&
  value !== null &&
  "v" in value &&
  "rid" in value &&
  "cid" in value &&
  "exp" in value &&
  (value as SendTokenPayload).v === TOKEN_VERSION &&
  typeof (value as SendTokenPayload).rid === "string" &&
  typeof (value as SendTokenPayload).cid === "string" &&
  typeof (value as SendTokenPayload).exp === "number"

const base64UrlEncode = (value: string) =>
  Buffer.from(value, "utf8").toString("base64url")

const base64UrlDecode = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8")

export function createSendToken(
  requestId: string,
  customerId: string,
  secret: string,
  nowMs = Date.now()
) {
  const payload: SendTokenPayload = {
    v: TOKEN_VERSION,
    rid: requestId,
    cid: customerId,
    exp: nowMs + SEND_TOKEN_TTL_MS,
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url")

  return `${encodedPayload}.${signature}`
}

export function verifySendToken(
  token: string,
  secret: string,
  nowMs = Date.now()
) {
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

  if (!isSendTokenPayload(parsed)) {
    return { valid: false, error: "Invalid token payload" }
  }

  const payload = parsed

  if (payload.exp <= nowMs) {
    return { valid: false, error: "Token expired" }
  }

  return { valid: true, payload }
}
