import { type NextRequest } from "next/server"
import { apiSuccess } from "@/lib/shared/api-response"
import { createApiContext, jsonWithRequestId, logApiSuccess, apiErrorResponse } from "@/lib/server/observability"
import { listPostOptions } from "@/features/post/server/post-options"

export async function GET(request: NextRequest) {
  const context = createApiContext(request)
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  const limit = Number(searchParams.get("limit") ?? "30") || 30

  try {
    const data = await listPostOptions({ q, limit })
    const response = jsonWithRequestId(apiSuccess(data), context.requestId)
    logApiSuccess(context, 200)
    return response
  } catch (error) {
    return apiErrorResponse(
      context,
      "POST_OPTIONS_FAILED",
      "포스트 목록을 불러오지 못했습니다.",
      500,
      error
    )
  }
}
