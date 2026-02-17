import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { normalizeSearchQuery } from "@/lib/shared/security"
import type { ApiResponse } from "@/lib/shared/api-response"
import type {
  SearchPostsResponse,
  SearchSort,
} from "@/features/search/server/search"
import {
  DEFAULT_PAGE_SIZE,
  normalizeTagValue,
  parsePage,
  parseTags,
  buildSearchPath,
  EMPTY_RESULTS,
} from "@/features/search/lib/search-utils"

export function useSearch() {
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

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5))
    }
  }, [])

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

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

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

  return {
    query, setQuery,
    results,
    isSearching,
    suggestions,
    showSuggestions, setShowSuggestions,
    recentSearches,
    popularTags,
    selectedTags, setSelectedTags,
    fromDate, setFromDate,
    toDate, setToDate,
    sort, setSort,
    searchError,
    inputRef,
    suggestionsRef,
    totalPages,
    handleSearch,
    handleSuggestionClick,
    handleKeyDown,
    toggleTagFilter,
    handlePageMove,
    removeRecentSearch,
    updateSearchRoute,
  }
}
