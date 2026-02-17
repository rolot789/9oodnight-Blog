import { type NextRequest } from "next/server"
import { z } from "zod"
import { apiSuccess } from "@/lib/shared/api-response"
import {
  getPopularTags,
  getSearchSuggestions,
  searchPosts,
  type SearchSort,
} from "@/features/search/server/search"
import { normalizeSearchQuery } from "@/lib/shared/security"
import { normalizeTagValue } from "@/features/search/lib/search-utils"
import { apiErrorResponse, createApiContext, jsonWithRequestId, logApiSuccess } from "@/lib/server/observability"
import { validateQueryParams } from "@/lib/server/security"

const searchQuerySchema = z.object({
  mode: z.enum(["popular-tags", "suggestions", "search"]).default("search"),
  q: z.string().trim().max(64).default(""),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from 날짜 형식은 YYYY-MM-DD 이어야 합니다.").optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to 날짜 형식은 YYYY-MM-DD 이어야 합니다.").optional(),
  sort: z.enum(["latest", "relevance"]).default("relevance"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

function validateDateValue(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined
  }
  const parsed = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }
  return raw
}

export async function GET(request: NextRequest) {
  const context = createApiContext(request)
  const { searchParams } = new URL(request.url)
  const query = validateQueryParams(searchParams, searchQuerySchema)
  if (!query.success) {
    return apiErrorResponse(
      context,
      "BAD_QUERY",
      query.message,
      400
    )
  }

  const { mode, from, to, sort, page, pageSize, q } = query.data

  try {
    if (mode === "popular-tags") {
      const data = await getPopularTags()
      const response = jsonWithRequestId(apiSuccess(data), context.requestId)
      logApiSuccess(context, 200)
      return response
    }

    if (mode === "suggestions") {
      const safeQuery = normalizeSearchQuery(q ?? "")
      if (!safeQuery) {
        return jsonWithRequestId(apiSuccess([]), context.requestId)
      }

      const data = await getSearchSuggestions(safeQuery)
      const response = jsonWithRequestId(apiSuccess(data), context.requestId)
      logApiSuccess(context, 200)
      return response
    }

    if (mode === "search") {
      const safeQuery = normalizeSearchQuery(q)
      if (!safeQuery && page === 1 && pageSize >= 0) {
        return jsonWithRequestId(
          apiSuccess({
            items: [],
            total: 0,
            page,
            pageSize,
            hasNextPage: false,
          }),
          context.requestId
        )
      }

      const tags = Array.from(
        new Set(
          searchParams
            .getAll("tags")
            .flatMap((tag) => tag.split(","))
            .map(normalizeTagValue)
            .filter(Boolean)
        )
      )
      const validatedFrom = validateDateValue(from)
      const validatedTo = validateDateValue(to)

      if (validatedFrom && validatedTo && validatedFrom > validatedTo) {
        return apiErrorResponse(
          context,
          "BAD_DATE_RANGE",
          "from 날짜는 to 날짜보다 늦을 수 없습니다.",
          400
        )
      }

      const data = await searchPosts({
        q: safeQuery,
        tags,
        from: validatedFrom,
        to: validatedTo,
        sort,
        page,
        pageSize,
      })
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
