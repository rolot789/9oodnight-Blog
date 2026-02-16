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
import { apiErrorResponse, createApiContext, jsonWithRequestId, logApiSuccess } from "@/lib/server/observability"
import { validateQueryParams } from "@/lib/server/security"

function normalizeTagParam(raw: string): string {
  return normalizeSearchQuery(raw).replace(/^#/, "").toLowerCase()
}

const searchQuerySchema = z.object({
  mode: z.enum(["popular-tags", "suggestions", "search"]).default("search"),
  q: z.string().trim().max(64).default(""),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from 날짜 형식은 YYYY-MM-DD 이어야 합니다.").optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to 날짜 형식은 YYYY-MM-DD 이어야 합니다.").optional(),
  sort: z.enum(["latest", "relevance"]).default("relevance"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

function parseDateParam(raw: string | null): string | undefined {
  if (!raw) {
    return undefined
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error("INVALID_DATE")
  }
  const parsed = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("INVALID_DATE")
  }
  return raw
}

function parseSortParam(raw: string | null): SearchSort {
  if (raw === "latest") {
    return "latest"
  }
  return "relevance"
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
            .map(normalizeTagParam)
            .filter(Boolean)
        )
      )
      const validatedFrom = parseDateParam(from)
      const validatedTo = parseDateParam(to)
      const validatedSort = parseSortParam(sort)

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
        sort: validatedSort,
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
      error instanceof Error && error.message === "INVALID_DATE"
        ? "BAD_DATE"
        : error instanceof Error && error.message === "INVALID_PAGE"
          ? "BAD_PAGE"
          : "SEARCH_FAILED",
      error instanceof Error && error.message === "INVALID_DATE"
        ? "날짜 형식은 YYYY-MM-DD 이어야 합니다."
        : error instanceof Error && error.message === "INVALID_PAGE"
          ? "page/pageSize 값은 1 이상의 정수여야 합니다."
          : "검색 처리 중 오류가 발생했습니다.",
      error instanceof Error && (error.message === "INVALID_DATE" || error.message === "INVALID_PAGE")
        ? 400
        : 500,
      error
    )
  }
}
