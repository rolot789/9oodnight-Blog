import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/types"

interface RelatedPostsQuery {
  currentPostId: string
  tags: string[] | null
  category: string
  limit?: number
}

export async function getRelatedPosts({
  currentPostId,
  tags,
  category,
  limit = 3,
}: RelatedPostsQuery): Promise<Post[]> {
  const supabase = await createClient()
  let relatedPosts: Post[] = []

  if (tags && tags.length > 0) {
    const { data: tagPosts } = await supabase
      .from("posts")
      .select("*")
      .neq("id", currentPostId)
      .overlaps("tags", tags)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (tagPosts) {
      relatedPosts = tagPosts as Post[]
    }
  }

  if (relatedPosts.length < limit) {
    const existingIds = [currentPostId, ...relatedPosts.map((p) => p.id)]
    const needed = limit - relatedPosts.length

    const { data: categoryPosts } = await supabase
      .from("posts")
      .select("*")
      .eq("category", category)
      .not("id", "in", `(${existingIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(needed)

    if (categoryPosts) {
      relatedPosts = [...relatedPosts, ...(categoryPosts as Post[])]
    }
  }

  return relatedPosts
}
