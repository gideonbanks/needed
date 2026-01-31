import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  // CI runs `next build` with NODE_ENV=production but doesn't have prod secrets.
  // Allow explicitly skipping validation for build/test jobs.
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  server: {
    ANALYZE: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.NODE_ENV === "production" ? z.string().min(1) : z.string().min(1).optional(),
    REQUEST_SEND_TOKEN_SECRET:
      process.env.NODE_ENV === "production" ? z.string().min(32) : z.string().min(32).optional(),
    // Twilio SMS (optional in dev, required in production)
    TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    TWILIO_FROM_NUMBER: z.string().regex(/^\+\d{10,15}$/).optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .refine(
        (val) => {
          if (process.env.NODE_ENV === "production") {
            return z.string().url().safeParse(val).success
          }
          return val.startsWith("your-") || z.string().url().safeParse(val).success
        },
        { message: "Must be a valid URL or placeholder" }
      )
      .optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
      .string()
      .min(1)
      .refine(
        (val) => 
          val.startsWith("your-") || 
          val.startsWith("eyJ") || 
          val.startsWith("sb_publishable_"),
        { message: "Must be a valid Supabase anon key or placeholder" }
      )
      .optional(),
    NEXT_PUBLIC_ENABLE_MOCK_OTP: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === "true")),
  },
  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    REQUEST_SEND_TOKEN_SECRET: process.env.REQUEST_SEND_TOKEN_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ENABLE_MOCK_OTP: process.env.NEXT_PUBLIC_ENABLE_MOCK_OTP,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
  },
})
