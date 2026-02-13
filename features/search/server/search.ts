import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/types"
import { normalizeSearchQuery } from "@/lib/shared/security"

export type SearchPostResult = Pick<
  Post,
  "id" | "title" | "category" | "tags" | "created_at" | "content"
>

export type SearchSort = "relevance" | "latest"

export interface SearchPostsParams {
  q: string
  tags?: string[]
  from?: string
  to?: string
  sort?: SearchSort
  page?: number
  pageSize?: number
}

export interface SearchPostsResponse {
  items: SearchPostResult[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

interface SuggestionRow {
  title: string
  tags: string[] | null
}

interface TagRow {
  tags: string[] | null
}

interface ScoredPost {
  post: SearchPostResult
  score: number
}

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50
const FUZZY_DISTANCE_LIMIT = 2

export async function getPopularTags(limit = 8): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("posts").select("tags")

  const tagCount: Record<string, number> = {}
  ;((data as TagRow[] | null) || []).forEach((post) => {
    post.tags?.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })

  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}

export async function getSearchSuggestions(rawQuery: string, limit = 6): Promise<string[]> {
  const searchQuery = normalizeSearchQuery(rawQuery)
  if (searchQuery.length < 2) {
    return []
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("posts")
    .select("title, tags")
    .or(`title.ilike.%${searchQuery}%,tags_searchable.ilike.%${searchQuery}%`)
    .limit(10)

  const rows = (data as SuggestionRow[] | null) || []
  const titleSuggestions = rows.map((row) => row.title)
  const tagSuggestions = rows
    .flatMap((row) => row.tags || [])
    .filter((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    .map((tag) => `#${tag}`)

  return Array.from(new Set([...tagSuggestions, ...titleSuggestions])).slice(0, limit)
}

function normalizeTag(tag: string): string {
  return normalizeSearchQuery(tag).replace(/^#/, "").toLowerCase()
}

function normalizeSearchText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s#._-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function tokenize(input: string): string[] {
  return normalizeSearchText(input)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const prev = new Array<number>(b.length + 1).fill(0)
  const curr = new Array<number>(b.length + 1).fill(0)
  for (let j = 0; j <= b.length; j += 1) {
    prev[j] = j
  }

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      )
    }
    for (let j = 0; j <= b.length; j += 1) {
      prev[j] = curr[j]
    }
  }

  return prev[b.length]
}

function hasNearMatch(token: string, candidates: string[]): boolean {
  if (token.length < 3) {
    return false
  }
  return candidates.some((candidate) => {
    const lowerCandidate = candidate.toLowerCase()
    if (lowerCandidate.includes(token)) {
      return true
    }
    const distance = levenshteinDistance(token, lowerCandidate)
    return distance <= FUZZY_DISTANCE_LIMIT
  })
}

function getRecencyBoost(createdAt: string): number {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) {
    return 0
  }
  const ageMs = Date.now() - created
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  return Math.max(0, 8 - ageDays / 45)
}

function scorePostForQuery(post: SearchPostResult, query: string): number {
  const normalizedQuery = normalizeSearchQuery(query).toLowerCase()
  if (!normalizedQuery) {
    return 0
  }

  const normalizedTitle = normalizeSearchText(post.title)
  const normalizedContent = normalizeSearchText(post.content)
  const normalizedTags = (post.tags || []).map((tag) => normalizeTag(tag))

  if (normalizedQuery.startsWith("#") && normalizedQuery.length > 1) {
    const tagQuery = normalizeTag(normalizedQuery)
    let tagScore = 0
    for (const tag of normalizedTags) {
      if (tag === tagQuery) {
        tagScore = Math.max(tagScore, 140)
      } else if (tag.includes(tagQuery)) {
        tagScore = Math.max(tagScore, 90)
      } else if (hasNearMatch(tagQuery, [tag])) {
        tagScore = Math.max(tagScore, 60)
      }
    }
    return tagScore + getRecencyBoost(post.created_at)
  }

  const queryTokens = tokenize(normalizedQuery)
  if (queryTokens.length === 0) {
    return 0
  }

  const titleTokens = tokenize(normalizedTitle)
  const contentTokens = tokenize(normalizedContent).slice(0, 200)

  let score = 0
  if (normalizedTitle.includes(normalizedQuery)) {
    score += 36
  }
  if (normalizedContent.includes(normalizedQuery)) {
    score += 14
  }

  for (const token of queryTokens) {
    if (normalizedTitle.includes(token)) {
      score += 26
    } else if (hasNearMatch(token, titleTokens)) {
      score += 16
    }

    if (normalizedContent.includes(token)) {
      score += 10
    } else if (hasNearMatch(token, contentTokens)) {
      score += 6
    }

    if (normalizedTags.some((tag) => tag.includes(token))) {
      score += 18
    } else if (hasNearMatch(token, normalizedTags)) {
      score += 11
    }
  }

  return score + getRecencyBoost(post.created_at)
}

function applyTagFilter(post: SearchPostResult, tags: string[]): boolean {
  if (tags.length === 0) {
    return true
  }

  const normalizedPostTags = new Set((post.tags || []).map((tag) => normalizeTag(tag)))
  return tags.some((tag) => normalizedPostTags.has(tag))
}

function clampPageSize(pageSize: number | undefined): number {
  if (!pageSize || Number.isNaN(pageSize)) {
    return DEFAULT_PAGE_SIZE
  }
  return Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE)
}

function clampPage(page: number | undefined): number {
  if (!page || Number.isNaN(page) || page < 1) {
    return 1
  }
  return Math.floor(page)
}

function sortScoredPosts(scored: ScoredPost[], sort: SearchSort): ScoredPost[] {
  const sorted = [...scored]
  if (sort === "latest") {
    sorted.sort((a, b) =>
      new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime()
    )
    return sorted
  }

  sorted.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime()
  })
  return sorted
}

export async function searchPosts(params: SearchPostsParams): Promise<SearchPostsResponse> {
  const q = normalizeSearchQuery(params.q || "")
  const normalizedTags = Array.from(
    new Set((params.tags || []).map(normalizeTag).filter(Boolean))
  )
  const sort: SearchSort = params.sort === "latest" ? "latest" : "relevance"
  const page = clampPage(params.page)
  const pageSize = clampPageSize(params.pageSize)

  if (!q && normalizedTags.length === 0) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      hasNextPage: false,
    }
  }

  const supabase = await createClient()
  let queryBuilder = supabase
    .from("posts")
    .select("id, title, category, tags, created_at, content")

  if (params.from) {
    queryBuilder = queryBuilder.gte("created_at", `${params.from}T00:00:00.000Z`)
  }

  if (params.to) {
    queryBuilder = queryBuilder.lte("created_at", `${params.to}T23:59:59.999Z`)
  }

  const { data, error } = await queryBuilder.order("created_at", { ascending: false })
  if (error) {
    throw error
  }

  const rows = ((data as SearchPostResult[] | null) || [])
    .filter((post) => applyTagFilter(post, normalizedTags))

  const scored = rows
    .map((post) => ({ post, score: scorePostForQuery(post, q) }))
    .filter(({ score }) => {
      if (!q) {
        return true
      }
      return score > 0
    })

  const sorted = sortScoredPosts(scored, sort)
  const total = sorted.length
  const offset = (page - 1) * pageSize
  const items = sorted.slice(offset, offset + pageSize).map((row) => row.post)

  return {
    items,
    total,
    page,
    pageSize,
    hasNextPage: offset + items.length < total,
  }
}
