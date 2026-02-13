import { NextResponse, type NextRequest } from "next/server"
import { apiError } from "@/lib/shared/api-response"
import { signOutWithJson } from "@/lib/server/auth"

export async function POST(request: NextRequest) {
  try {
    return await signOutWithJson(request)
  } catch (error) {
    console.error("Signout API error:", error)
    return NextResponse.json(
      apiError("SIGNOUT_FAILED", "로그아웃 처리에 실패했습니다."),
      { status: 500 }
    )
  }
}
