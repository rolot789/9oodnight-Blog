import { NextResponse, type NextRequest } from "next/server"
import { signOutWithJson } from "@/lib/server/auth"
import { apiErrorResponse, createApiContext, logApiSuccess } from "@/lib/server/observability"

export async function POST(request: NextRequest) {
  const context = createApiContext(request)
  try {
    const response = await signOutWithJson(request)
    response.headers.set("x-request-id", context.requestId)
    logApiSuccess(context, 200)
    return response
  } catch (error) {
    return apiErrorResponse(
      context,
      "SIGNOUT_FAILED",
      "로그아웃 처리에 실패했습니다.",
      500,
      error
    )
  }
}
