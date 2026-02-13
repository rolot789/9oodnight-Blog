import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/types"
import { normalizeSearchQuery } from "@/lib/shared/security"

export type SearchPostResult = Pick<
  Post,
  "id" | "title" | "category" | "tags" | "created_at" | "content"
>

interface SuggestionRow {
  title: string
  tags: string[] | null
}

interface TagRow {
  tags: string[] | null
}

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

export async function searchPosts(rawQuery: string): Promise<SearchPostResult[]> {
  const searchQuery = normalizeSearchQuery(rawQuery)
  if (!searchQuery) {
    return []
  }

  const supabase = await createClient()
  let queryBuilder = supabase
    .from("posts")
    .select("id, title, category, tags, created_at, content")

  if (searchQuery.startsWith("#") && searchQuery.length > 1) {
    const tagQuery = searchQuery.substring(1)
    queryBuilder = queryBuilder.or(`tags_searchable.ilike.%${tagQuery}%`)
  } else {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,tags_searchable.ilike.%${searchQuery}%`
    )
  }

  const { data, error } = await queryBuilder.order("created_at", { ascending: false })
  if (error) {
    throw error
  }

  return ((data as SearchPostResult[] | null) || [])
}
