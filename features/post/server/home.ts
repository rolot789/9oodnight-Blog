import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/types"

type HomePost = Pick<
  Post,
  "id" | "title" | "category" | "excerpt" | "image_url" | "tags" | "created_at" | "read_time"
>

interface HomePageData {
  user: User | null
  blogPosts: HomePost[]
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
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let query = supabase
      .from("posts")
      .select("id, title, category, excerpt, image_url, tags, created_at, read_time")
      .order("created_at", { ascending: false })

    if (selectedCategory !== "All") {
      query = query.eq("category", selectedCategory)
    }

    if (selectedTag) {
      query = query.contains("tags", [selectedTag])
    }

    const { data: posts } = await query
    const blogPosts = (posts as HomePost[]) || []

    const { data: allPosts } = await supabase.from("posts").select("tags")
    const allTags = Array.from(new Set(((allPosts as TagRow[] | null) || []).flatMap((p) => p.tags || []))).sort()

    return {
      user,
      blogPosts,
      allTags,
    }
  } catch (error) {
    console.error("Failed to load home page data:", error)
    return {
      user: null,
      blogPosts: [],
      allTags: [],
    }
  }
}
