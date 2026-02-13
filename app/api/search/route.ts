import { NextResponse, type NextRequest } from "next/server"
import { apiError, apiSuccess } from "@/lib/shared/api-response"
import { getPopularTags, getSearchSuggestions, searchPosts } from "@/features/search/server/search"
import { normalizeSearchQuery } from "@/lib/shared/security"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode") ?? "search"

  try {
    if (mode === "popular-tags") {
      const data = await getPopularTags()
      return NextResponse.json(apiSuccess(data))
    }

    if (mode === "suggestions") {
      const q = normalizeSearchQuery(searchParams.get("q") ?? "")
      const data = await getSearchSuggestions(q)
      return NextResponse.json(apiSuccess(data))
    }

    if (mode === "search") {
      const q = normalizeSearchQuery(searchParams.get("q") ?? "")
      const data = await searchPosts(q)
      return NextResponse.json(apiSuccess(data))
    }

    return NextResponse.json(
      apiError("BAD_MODE", "지원하지 않는 검색 모드입니다."),
      { status: 400 }
    )
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      apiError("SEARCH_FAILED", "검색 처리 중 오류가 발생했습니다."),
      { status: 500 }
    )
  }
}
