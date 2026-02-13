import type { Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/types"

interface HomePageData {
  session: Session | null
  blogPosts: Post[]
  allTags: string[]
}

interface TagRow {
  tags: string[] | null
}

interface HomePageQuery {
  selectedCategory: string
  selectedTag: string | null
}

export async function getHomePageData({
  selectedCategory,
  selectedTag,
}: HomePageQuery): Promise<HomePageData> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let query = supabase.from("posts").select("*").order("created_at", { ascending: false })

  if (selectedCategory !== "All") {
    query = query.eq("category", selectedCategory)
  }

  if (selectedTag) {
    query = query.contains("tags", [selectedTag])
  }

  const { data: posts } = await query
  const blogPosts = (posts as Post[]) || []

  const { data: allPosts } = await supabase.from("posts").select("tags")
  const allTags = Array.from(new Set(((allPosts as TagRow[] | null) || []).flatMap((p) => p.tags || []))).sort()

  return {
    session,
    blogPosts,
    allTags,
  }
}
