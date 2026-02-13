"use client"

import { useState, useEffect, useCallback, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  Search as SearchIcon,
  CornerDownLeft,
  X,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { stripMarkdown } from "@/lib/shared/utils"
import { MAX_SEARCH_QUERY_LENGTH, normalizeSearchQuery } from "@/lib/shared/security"
import type { ApiResponse } from "@/lib/shared/api-response"
import type {
  SearchPostResult,
  SearchPostsResponse,
  SearchSort,
} from "@/features/search/server/search"

const DEFAULT_PAGE_SIZE = 10

function normalizeTagValue(value: string): string {
  return normalizeSearchQuery(value).replace(/^#/, "").toLowerCase()
}

function parsePage(value: string | null): number {
  if (!value) {
    return 1
  }
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1
  }
  return parsed
}

function parseTags(searchParams: Pick<URLSearchParams, "getAll">): string[] {
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

function buildSearchPath(params: {
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

// Helper component for highlighting text
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="bg-[#fff9c4] text-[#080f18] font-medium">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  )
}

// Helper to extract relevant snippet around the match
const getRelevantSnippet = (content: string, query: string, maxLength = 200) => {
  const plainText = stripMarkdown(content)
  if (!query.trim()) return plainText.substring(0, maxLength) + (plainText.length > maxLength ? "..." : "")

  const lowerContent = plainText.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const matchIndex = lowerContent.indexOf(lowerQuery)

  // If query not found in content (maybe matched in title), show beginning
  if (matchIndex === -1) return plainText.substring(0, maxLength) + (plainText.length > maxLength ? "..." : "")

  // Calculate start and end indices to center the match
  const halfLength = maxLength / 2
  const start = Math.max(0, matchIndex - halfLength)
  const end = Math.min(plainText.length, matchIndex + query.length + halfLength)

  let snippet = plainText.substring(start, end)

  if (start > 0) snippet = "..." + snippet
  if (end < plainText.length) snippet = snippet + "..."

  return snippet
}

const EMPTY_RESULTS: SearchPostsResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  hasNextPage: false,
}

function SearchContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchPostsResponse>(EMPTY_RESULTS)
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularTags, setPopularTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sort, setSort] = useState<SearchSort>("relevance")
  const [searchError, setSearchError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const fetchSearchApi = useCallback(async <T,>(url: string): Promise<T> => {
    const res = await fetch(url)
    const payload = (await res.json()) as ApiResponse<T>
    if (!payload.ok) {
      throw new Error(payload.error.message)
    }
    return payload.data
  }, [])

  const runSearch = useCallback(
    async (params: {
      q: string
      tags: string[]
      from: string
      to: string
      sort: SearchSort
      page: number
    }) => {
      const safeQuery = normalizeSearchQuery(params.q)
      const normalizedTags = Array.from(new Set(params.tags.map(normalizeTagValue).filter(Boolean)))

      if (!safeQuery && normalizedTags.length === 0) {
        setResults({
          ...EMPTY_RESULTS,
          page: params.page,
        })
        setSearchError(null)
        return
      }

      const requestParams = new URLSearchParams({
        mode: "search",
        sort: params.sort,
        page: String(params.page),
        pageSize: String(DEFAULT_PAGE_SIZE),
      })

      if (safeQuery) {
        requestParams.set("q", safeQuery)
      }
      if (normalizedTags.length > 0) {
        requestParams.set("tags", normalizedTags.join(","))
      }
      if (params.from) {
        requestParams.set("from", params.from)
      }
      if (params.to) {
        requestParams.set("to", params.to)
      }

      setIsSearching(true)
      setSearchError(null)

      try {
        const data = await fetchSearchApi<SearchPostsResponse>(`/api/search?${requestParams.toString()}`)
        setResults(data)
      } catch (error) {
        console.error("Search error:", error)
        setSearchError("검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")
        setResults({
          ...EMPTY_RESULTS,
          page: params.page,
        })
      }

      setIsSearching(false)
    },
    [fetchSearchApi]
  )

  // 최근 검색어 로드
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5))
    }
  }, [])

  // 인기 태그 로드
  useEffect(() => {
    const loadPopularTags = async () => {
      try {
        const tags = await fetchSearchApi<string[]>("/api/search?mode=popular-tags")
        setPopularTags(tags)
      } catch (error) {
        console.error("Popular tags load failed:", error)
      }
    }
    loadPopularTags()
  }, [fetchSearchApi])

  // URL 상태 동기화
  useEffect(() => {
    const q = normalizeSearchQuery(searchParams.get("q") || "")
    const tags = parseTags(searchParams)
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const nextSort: SearchSort = searchParams.get("sort") === "latest" ? "latest" : "relevance"
    const page = parsePage(searchParams.get("page"))

    setQuery(q)
    setSelectedTags(tags)
    setFromDate(from)
    setToDate(to)
    setSort(nextSort)

    runSearch({
      q,
      tags,
      from,
      to,
      sort: nextSort,
      page,
    })
  }, [runSearch, searchParams])

  // 자동완성 제안
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    const safeQuery = normalizeSearchQuery(searchQuery)
    if (safeQuery.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const data = await fetchSearchApi<string[]>(
        `/api/search?mode=suggestions&q=${encodeURIComponent(safeQuery)}`
      )
      setSuggestions(data)
    } catch (error) {
      console.error("Suggestion load failed:", error)
      setSuggestions([])
    }
  }, [fetchSearchApi])

  // 검색어 변경 시 자동완성
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        fetchSuggestions(query)
      } else {
        setSuggestions([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query, fetchSuggestions])

  // 외부 클릭 시 제안 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 최근 검색어 저장
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  // 최근 검색어 삭제
  const removeRecentSearch = (searchQuery: string) => {
    const updated = recentSearches.filter((s) => s !== searchQuery)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  const updateSearchRoute = useCallback(
    (next: {
      q: string
      tags: string[]
      from: string
      to: string
      sort: SearchSort
      page: number
    }) => {
      const safeQuery = normalizeSearchQuery(next.q)
      const normalizedTags = Array.from(new Set(next.tags.map(normalizeTagValue).filter(Boolean)))
      router.replace(
        buildSearchPath({
          q: safeQuery,
          tags: normalizedTags,
          from: next.from,
          to: next.to,
          sort: next.sort,
          page: next.page,
        })
      )
    },
    [router]
  )

  const handleSearch = () => {
    const safeQuery = normalizeSearchQuery(query)
    if (safeQuery) {
      saveRecentSearch(safeQuery)
    }

    updateSearchRoute({
      q: safeQuery,
      tags: selectedTags,
      from: fromDate,
      to: toDate,
      sort,
      page: 1,
    })
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    const safeSuggestion = normalizeSearchQuery(suggestion)
    setQuery(safeSuggestion)
    setShowSuggestions(false)
    saveRecentSearch(safeSuggestion)
    updateSearchRoute({
      q: safeSuggestion,
      tags: selectedTags,
      from: fromDate,
      to: toDate,
      sort,
      page: 1,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const toggleTagFilter = (tag: string) => {
    const normalizedTag = normalizeTagValue(tag)
    const nextTags = selectedTags.includes(normalizedTag)
      ? selectedTags.filter((item) => item !== normalizedTag)
      : [...selectedTags, normalizedTag]

    setSelectedTags(nextTags)
    updateSearchRoute({
      q: query,
      tags: nextTags,
      from: fromDate,
      to: toDate,
      sort,
      page: 1,
    })
  }

  const handlePageMove = (nextPage: number) => {
    if (nextPage < 1) {
      return
    }

    updateSearchRoute({
      q: query,
      tags: selectedTags,
      from: fromDate,
      to: toDate,
      sort,
      page: nextPage,
    })
  }

  const totalPages = Math.max(1, Math.ceil(results.total / results.pageSize))

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <main className="mx-auto max-w-4xl px-6 py-12">

        {/* Search Input Section */}
        <div className="mb-8">
          <h1 className="mb-8 text-center text-2xl font-light tracking-wide text-[#080f18]">SEARCH</h1>
          <div className="relative mx-auto max-w-2xl">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b8c89]" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search titles, content, or #tags..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                className="h-14 w-full rounded-full border border-[#e5e5e5] bg-white pl-12 pr-12 text-lg text-[#080f18] shadow-sm placeholder:text-[#c0c0c0] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                autoFocus
                maxLength={MAX_SEARCH_QUERY_LENGTH}
              />
              <button
                onClick={handleSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b8c89] transition-colors hover:text-[#080f18]"
                aria-label="Search"
              >
                <CornerDownLeft className="h-5 w-5" />
              </button>
            </div>

            {searchError && (
              <p className="mt-3 text-center text-xs tracking-wider text-red-600">{searchError}</p>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0 || popularTags.length > 0) && !query.trim() && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 mt-2 w-full rounded-lg border border-[#e5e5e5] bg-white shadow-lg"
              >
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="border-b border-[#e5e5e5] p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8b8c89]">
                      <Clock className="h-3 w-3" />
                      RECENT SEARCHES
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search) => (
                        <div
                          key={search}
                          className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50"
                        >
                          <button
                            onClick={() => handleSuggestionClick(search)}
                            className="flex-1 text-left text-sm text-[#080f18]"
                          >
                            {search}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeRecentSearch(search)
                            }}
                            className="text-[#8b8c89] hover:text-[#080f18]"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Tags */}
                {popularTags.length > 0 && (
                  <div className="p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8b8c89]">
                      <TrendingUp className="h-3 w-3" />
                      POPULAR TAGS
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleSuggestionClick(`#${tag}`)}
                          className="rounded-full border border-[#e5e5e5] px-3 py-1 text-xs text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && query.trim() && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 mt-2 w-full rounded-lg border border-[#e5e5e5] bg-white shadow-lg"
              >
                <div className="py-2">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#080f18] hover:bg-gray-50"
                    >
                      <SearchIcon className="h-4 w-4 text-[#8b8c89]" />
                      <span className="line-clamp-1">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-10 rounded border border-[#e5e5e5] bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <p className="mb-1 text-[11px] tracking-wider text-[#8b8c89]">SORT</p>
              <Select
                value={sort}
                onValueChange={(value) => {
                  const nextSort: SearchSort = value === "latest" ? "latest" : "relevance"
                  setSort(nextSort)
                  updateSearchRoute({
                    q: query,
                    tags: selectedTags,
                    from: fromDate,
                    to: toDate,
                    sort: nextSort,
                    page: 1,
                  })
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="latest">Latest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-1 text-[11px] tracking-wider text-[#8b8c89]">FROM</p>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  const nextFrom = e.target.value
                  setFromDate(nextFrom)
                  updateSearchRoute({
                    q: query,
                    tags: selectedTags,
                    from: nextFrom,
                    to: toDate,
                    sort,
                    page: 1,
                  })
                }}
                className="h-10 rounded-none"
              />
            </div>

            <div>
              <p className="mb-1 text-[11px] tracking-wider text-[#8b8c89]">TO</p>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  const nextTo = e.target.value
                  setToDate(nextTo)
                  updateSearchRoute({
                    q: query,
                    tags: selectedTags,
                    from: fromDate,
                    to: nextTo,
                    sort,
                    page: 1,
                  })
                }}
                className="h-10 rounded-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedTags([])
                  setFromDate("")
                  setToDate("")
                  setSort("relevance")
                  updateSearchRoute({
                    q: query,
                    tags: [],
                    from: "",
                    to: "",
                    sort: "relevance",
                    page: 1,
                  })
                }}
                className="h-10 w-full border border-[#e5e5e5] px-3 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]"
              >
                RESET FILTERS
              </button>
            </div>
          </div>

          {popularTags.length > 0 && (
            <div className="mt-4 border-t border-[#f0f0f0] pt-4">
              <p className="mb-2 text-[11px] tracking-wider text-[#8b8c89]">TAG FILTER</p>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => {
                  const normalizedTag = normalizeTagValue(tag)
                  const isSelected = selectedTags.includes(normalizedTag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        isSelected
                          ? "border-[#080f18] bg-[#080f18] text-white"
                          : "border-[#e5e5e5] text-[#8b8c89] hover:border-[#080f18] hover:text-[#080f18]"
                      }`}
                    >
                      #{tag}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-8">
          {!isSearching && (query.trim() || selectedTags.length > 0) && (
            <p className="text-xs tracking-wider text-[#8b8c89]">
              {results.total} result{results.total === 1 ? "" : "s"}
            </p>
          )}

          {isSearching ? (
            <div className="text-center text-sm text-[#8b8c89]">Searching...</div>
          ) : (query || selectedTags.length > 0) && results.items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[#8b8c89]">No results found for "{query || selectedTags.map((tag) => `#${tag}`).join(" ")}"</p>
            </div>
          ) : (
            results.items.map((post: SearchPostResult) => (
              <article key={post.id} className="group rounded border border-[#e5e5e5] bg-white p-8 shadow-sm transition-all hover:border-[#080f18]">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="border border-[#6096ba] px-2 py-0.5 text-[10px] font-normal tracking-wider text-[#6096ba]">
                    {post.category}
                  </span>
                  {post.tags && post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] font-normal tracking-wider">
                      {tag}
                    </Badge>
                  ))}
                  <span className="ml-2 text-[11px] text-[#8b8c89]">
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <Link href={`/post/${post.id}`} className="block">
                  <h2 className="mb-3 text-xl font-medium text-[#080f18] transition-colors group-hover:text-[#6096ba]">
                    <HighlightedText text={post.title} highlight={query} />
                  </h2>
                </Link>

                <p className="mb-4 text-sm leading-relaxed text-[#4a4a4a]">
                  <HighlightedText
                    text={getRelevantSnippet(post.content, query)}
                    highlight={query}
                  />
                </p>

                <Link
                  href={`/post/${post.id}`}
                  className="inline-flex items-center text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]"
                >
                  READ MORE
                  <svg className="ml-2 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </article>
            ))
          )}
        </div>

        {!isSearching && results.total > results.pageSize && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => handlePageMove(results.page - 1)}
              disabled={results.page <= 1}
              className="inline-flex items-center gap-1 border border-[#e5e5e5] px-3 py-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-3 w-3" />
              PREV
            </button>

            <span className="text-xs tracking-wider text-[#8b8c89]">
              PAGE {results.page} / {totalPages}
            </span>

            <button
              onClick={() => handlePageMove(results.page + 1)}
              disabled={!results.hasNextPage}
              className="inline-flex items-center gap-1 border border-[#e5e5e5] px-3 py-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18] disabled:cursor-not-allowed disabled:opacity-50"
            >
              NEXT
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafbfc] flex items-center justify-center text-[#8b8c89]">Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}
