"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search as SearchIcon, CornerDownLeft } from "lucide-react"
import type { Post } from "@/lib/types"

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
        regex.test(part) ? (
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
  if (!query.trim()) return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "")

  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const matchIndex = lowerContent.indexOf(lowerQuery)

  // If query not found in content (maybe matched in title), show beginning
  if (matchIndex === -1) return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "")

  // Calculate start and end indices to center the match
  const halfLength = maxLength / 2
  const start = Math.max(0, matchIndex - halfLength)
  const end = Math.min(content.length, matchIndex + query.length + halfLength)

  let snippet = content.substring(start, end)

  if (start > 0) snippet = "..." + snippet
  if (end < content.length) snippet = snippet + "..."

  return snippet
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Post[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    
    // Search in both title and content
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setResults(data as Post[])
    }
    setIsSearching(false)
  }, [supabase])

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set("q", query)
    } else {
      params.delete("q")
    }
    router.replace(`/search?${params.toString()}`)
    performSearch(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // Initial search on load if query exists
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery, performSearch])

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <main className="mx-auto max-w-4xl px-6 py-12">
        
        {/* Search Input Section */}
        <div className="mb-12">
          <h1 className="mb-8 text-center text-2xl font-light tracking-wide text-[#080f18]">SEARCH</h1>
          <div className="relative mx-auto max-w-2xl">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b8c89]" />
              <Input
                type="text"
                placeholder="Search titles and content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-14 w-full rounded-full border border-[#e5e5e5] bg-white pl-12 pr-12 text-lg text-[#080f18] shadow-sm placeholder:text-[#c0c0c0] focus-visible:border-[#080f18] focus-visible:ring-0"
                autoFocus
              />
              <button
                onClick={handleSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b8c89] transition-colors hover:text-[#080f18]"
                aria-label="Search"
              >
                <CornerDownLeft className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-8">
          {isSearching ? (
            <div className="text-center text-sm text-[#8b8c89]">Searching...</div>
          ) : query && results.length === 0 && !isSearching ? ( // Added check to prevent showing "No results" before search
             // Only show "No results" if a search has actually been performed or initial load is done with no results
             // But checking results.length === 0 is tricky with initial state. 
             // Let's rely on the fact that if query is empty, we don't search. 
             // If query exists but results empty -> No results.
             // We need to know if a search was ATTEMPTED.
             // For simplicity, let's keep it simple: if query exists and no results
             query.trim() !== "" && (
              <div className="py-12 text-center">
                <p className="text-[#8b8c89]">No results found for "{query}"</p>
              </div>
             )
          ) : (
            results.map((post) => (
              <article key={post.id} className="group rounded border border-[#e5e5e5] bg-white p-8 shadow-sm transition-all hover:border-[#080f18]">
                <div className="mb-4 flex items-center gap-3">
                  <span className="border border-[#6096ba] px-2 py-0.5 text-[10px] font-normal tracking-wider text-[#6096ba]">
                    {post.category}
                  </span>
                  <span className="text-[11px] text-[#8b8c89]">
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
      </main>
    </div>
  )
}
