import { NextResponse } from "next/server"
import { clearProviderSession } from "lib/provider/session"

export async function POST() {
  await clearProviderSession()

  return NextResponse.json({
    success: true,
    message: "Logged out",
  })
}
