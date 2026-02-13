import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiError, apiSuccess } from "@/lib/shared/api-response"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return NextResponse.json(
      apiSuccess({
        user: user ? { id: user.id, email: user.email ?? null } : null,
      })
    )
  } catch (error) {
    console.error("Session API error:", error)
    return NextResponse.json(
      apiError("SESSION_FETCH_FAILED", "세션 정보를 확인하지 못했습니다."),
      { status: 500 }
    )
  }
}
