import { NextResponse, type NextRequest } from "next/server"
import { apiError, apiSuccess } from "@/lib/shared/api-response"
import { getPopularTags, getSearchSuggestions, searchPosts } from "@/features/search/server/search"
import { normalizeSearchQuery } from "@/lib/shared/security"
import { apiErrorResponse, createApiContext, jsonWithRequestId, logApiSuccess } from "@/lib/server/observability"

export async function GET(request: NextRequest) {
  const context = createApiContext(request)
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode") ?? "search"

  try {
    if (mode === "popular-tags") {
      const data = await getPopularTags()
      const response = jsonWithRequestId(apiSuccess(data), context.requestId)
      logApiSuccess(context, 200)
      return response
    }

    if (mode === "suggestions") {
      const q = normalizeSearchQuery(searchParams.get("q") ?? "")
      const data = await getSearchSuggestions(q)
      const response = jsonWithRequestId(apiSuccess(data), context.requestId)
      logApiSuccess(context, 200)
      return response
    }

    if (mode === "search") {
      const q = normalizeSearchQuery(searchParams.get("q") ?? "")
      const data = await searchPosts(q)
      const response = jsonWithRequestId(apiSuccess(data), context.requestId)
      logApiSuccess(context, 200)
      return response
    }

    return apiErrorResponse(
      context,
      "BAD_MODE",
      "지원하지 않는 검색 모드입니다.",
      400
    )
  } catch (error) {
    return apiErrorResponse(
      context,
      "SEARCH_FAILED",
      "검색 처리 중 오류가 발생했습니다.",
      500,
      error
    )
  }
}
