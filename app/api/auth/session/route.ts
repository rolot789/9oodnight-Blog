import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiSuccess } from "@/lib/shared/api-response"
import { apiErrorResponse, createApiContext, jsonWithRequestId, logApiSuccess } from "@/lib/server/observability"

export async function GET(request: NextRequest) {
  const context = createApiContext(request)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const response = jsonWithRequestId(
      apiSuccess({
        user: user ? { id: user.id, email: user.email ?? null } : null,
      }),
      context.requestId
    )
    logApiSuccess(context, 200)
    return response
  } catch (error) {
    return apiErrorResponse(
      context,
      "SESSION_FETCH_FAILED",
      "세션 정보를 확인하지 못했습니다.",
      500,
      error
    )
  }
}
