"use client"

import { Suspense } from "react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toPostPath } from "@/lib/shared/slug"
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
import { MAX_SEARCH_QUERY_LENGTH } from "@/lib/shared/security"
import type {
  SearchPostResult,
  SearchSort,
} from "@/features/search/server/search"
import { normalizeTagValue, getRelevantSnippet } from "@/features/search/lib/search-utils"
import HighlightedText from "@/features/search/components/HighlightedText"
import { useSearch } from "@/features/search/hooks/useSearch"

function SearchContent() {
  const {
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
  } = useSearch()

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
              results.items.map((post: SearchPostResult) => {
              const postPath = toPostPath(post.slug || post.id)

              return (
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

                  <Link href={postPath} className="block">
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
                    href={postPath}
                    className="inline-flex items-center text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]"
                  >
                    READ MORE
                    <svg className="ml-2 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </article>
              )
            })
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
