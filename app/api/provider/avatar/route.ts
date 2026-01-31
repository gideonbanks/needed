import { NextResponse } from "next/server"
import { getProviderSession } from "lib/provider/session"
import { createAdminClient } from "lib/supabase/admin"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST(request: Request) {
  const providerId = await getProviderSession()

  if (!providerId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    // Some TS environments can incorrectly type `FormData` without `.get()`.
    // Runtime (Request.formData()) supports it; we defensively narrow here.
    const file = ((formData as unknown as { get?: (name: string) => unknown }).get?.("file") ??
      null) as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${providerId}/${Date.now()}.${ext}`

    // Delete old avatar if exists
    const { data: provider } = await supabase
      .from("providers")
      .select("avatar_url")
      .eq("id", providerId)
      .single()

    if (provider?.avatar_url) {
      // Extract path from URL
      const oldPath = provider.avatar_url.split("/avatars/")[1]
      if (oldPath) {
        await supabase.storage.from("avatars").remove([oldPath])
      }
    }

    // Upload new avatar
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("[Avatar Upload] Storage error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload avatar" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("avatars")
      .getPublicUrl(filename)

    // Update provider record
    const { error: updateError } = await supabase
      .from("providers")
      .update({ avatar_url: publicUrl.publicUrl })
      .eq("id", providerId)

    if (updateError) {
      console.error("[Avatar Upload] Database error:", updateError)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      avatarUrl: publicUrl.publicUrl,
    })
  } catch (error) {
    console.error("[Avatar Upload] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const providerId = await getProviderSession()

  if (!providerId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const supabase = createAdminClient()

    // Get current avatar URL
    const { data: provider } = await supabase
      .from("providers")
      .select("avatar_url")
      .eq("id", providerId)
      .single()

    if (provider?.avatar_url) {
      // Extract path from URL and delete from storage
      const oldPath = provider.avatar_url.split("/avatars/")[1]
      if (oldPath) {
        await supabase.storage.from("avatars").remove([oldPath])
      }
    }

    // Clear avatar_url in database
    const { error: updateError } = await supabase
      .from("providers")
      .update({ avatar_url: null })
      .eq("id", providerId)

    if (updateError) {
      console.error("[Avatar Delete] Database error:", updateError)
      return NextResponse.json(
        { error: "Failed to remove avatar" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Avatar Delete] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
