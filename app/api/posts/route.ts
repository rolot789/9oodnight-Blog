import { type NextRequest } from "next/server"
import { z } from "zod"
import { apiSuccess } from "@/lib/shared/api-response"
import { createApiContext, jsonWithRequestId, logApiSuccess, apiErrorResponse } from "@/lib/server/observability"
import { listPostOptions } from "@/features/post/server/post-options"
import { validateQueryParams } from "@/lib/server/security"

const postsOptionsQuerySchema = z.object({
  q: z.string().trim().max(64).default(""),
  limit: z.coerce.number().int().min(1).max(50).default(30),
})

export async function GET(request: NextRequest) {
  const context = createApiContext(request)
  const { searchParams } = new URL(request.url)
  const queryValidation = validateQueryParams(searchParams, postsOptionsQuerySchema)
  if (!queryValidation.success) {
    return apiErrorResponse(
      context,
      "INVALID_QUERY",
      queryValidation.message,
      400
    )
  }

  const { q, limit } = queryValidation.data

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
