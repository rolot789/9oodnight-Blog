import { cache } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import type { Post, SeriesContext, Todo } from "@/lib/types"
import { getSeriesContext } from "@/features/post/server/series"
import { listTodosByPost } from "@/features/todo/server/todos"

interface PostPageData {
  user: User | null
  post: Post | null
  seriesContext: SeriesContext | null
  linkedTodos: Todo[]
}

export const getPostById = cache(async (id: string): Promise<Post | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) {
    return null
  }

  return data as Post
})

export async function getPostPageData(id: string): Promise<PostPageData> {
  const supabase = await createClient()

  const [userResult, post, seriesContext, linkedTodos] = await Promise.all([
    supabase.auth.getUser().catch(() => null),
    getPostById(id).catch(() => null),
    getSeriesContext(id).catch(() => null),
    listTodosByPost(id, 12).catch(() => []),
  ])

  return {
    user: userResult?.data.user ?? null,
    post,
    seriesContext,
    linkedTodos,
  }
}
