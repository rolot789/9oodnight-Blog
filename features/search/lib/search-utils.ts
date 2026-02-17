import { normalizeSearchQuery } from "@/lib/shared/security"
import { stripMarkdown } from "@/lib/shared/utils"
import type { SearchPostsResponse, SearchSort } from "@/features/search/server/search"

export const DEFAULT_PAGE_SIZE = 10

export function normalizeTagValue(value: string): string {
  return normalizeSearchQuery(value).replace(/^#/, "").toLowerCase()
}

export function parsePage(value: string | null): number {
  if (!value) {
    return 1
  }
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1
  }
  return parsed
}

export function parseTags(searchParams: Pick<URLSearchParams, "getAll">): string[] {
  return Array.from(
    new Set(
      searchParams
        .getAll("tags")
        .flatMap((tag) => tag.split(","))
        .map(normalizeTagValue)
        .filter(Boolean)
    )
  )
}

export function buildSearchPath(params: {
  q: string
  tags: string[]
  from: string
  to: string
  sort: SearchSort
  page: number
}): string {
  const queryParams = new URLSearchParams()

  if (params.q) {
    queryParams.set("q", params.q)
  }
  if (params.tags.length > 0) {
    queryParams.set("tags", params.tags.join(","))
  }
  if (params.from) {
    queryParams.set("from", params.from)
  }
  if (params.to) {
    queryParams.set("to", params.to)
  }
  if (params.sort !== "relevance") {
    queryParams.set("sort", params.sort)
  }
  if (params.page > 1) {
    queryParams.set("page", String(params.page))
  }

  queryParams.set("pageSize", String(DEFAULT_PAGE_SIZE))

  const query = queryParams.toString()
  return query ? `/search?${query}` : "/search"
}

export function getRelevantSnippet(content: string, query: string, maxLength = 200) {
  const plainText = stripMarkdown(content)
  if (!query.trim()) return plainText.substring(0, maxLength) + (plainText.length > maxLength ? "..." : "")

  const lowerContent = plainText.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const matchIndex = lowerContent.indexOf(lowerQuery)

  if (matchIndex === -1) return plainText.substring(0, maxLength) + (plainText.length > maxLength ? "..." : "")

  const halfLength = maxLength / 2
  const start = Math.max(0, matchIndex - halfLength)
  const end = Math.min(plainText.length, matchIndex + query.length + halfLength)

  let snippet = plainText.substring(start, end)

  if (start > 0) snippet = "..." + snippet
  if (end < plainText.length) snippet = snippet + "..."

  return snippet
}

export const EMPTY_RESULTS: SearchPostsResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  hasNextPage: false,
}
