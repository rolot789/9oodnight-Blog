import { cache } from "react"
import type { Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/types"

interface PostPageData {
  session: Session | null
  post: Post | null
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
  const [{ data: sessionData }, post] = await Promise.all([
    supabase.auth.getSession(),
    getPostById(id),
  ])

  return {
    session: sessionData.session,
    post,
  }
}
