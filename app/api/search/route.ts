import { type NextRequest } from "next/server"
import { apiSuccess } from "@/lib/shared/api-response"
import {
  getPopularTags,
  getSearchSuggestions,
  searchPosts,
  type SearchSort,
} from "@/features/search/server/search"
import { normalizeSearchQuery } from "@/lib/shared/security"
import { apiErrorResponse, createApiContext, jsonWithRequestId, logApiSuccess } from "@/lib/server/observability"

function normalizeTagParam(raw: string): string {
  return normalizeSearchQuery(raw).replace(/^#/, "").toLowerCase()
}

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

function parsePageParam(raw: string | null, fallback: number): number {
  if (!raw) {
    return fallback
  }
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new Error("INVALID_PAGE")
  }
  return parsed
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
      const tags = Array.from(
        new Set(
          searchParams
            .getAll("tags")
            .flatMap((tag) => tag.split(","))
            .map(normalizeTagParam)
            .filter(Boolean)
        )
      )
      const from = parseDateParam(searchParams.get("from"))
      const to = parseDateParam(searchParams.get("to"))
      const sort = parseSortParam(searchParams.get("sort"))
      const page = parsePageParam(searchParams.get("page"), 1)
      const pageSize = parsePageParam(searchParams.get("pageSize"), 10)

      if (from && to && from > to) {
        return apiErrorResponse(
          context,
          "BAD_DATE_RANGE",
          "from 날짜는 to 날짜보다 늦을 수 없습니다.",
          400
        )
      }

      const data = await searchPosts({
        q,
        tags,
        from,
        to,
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
