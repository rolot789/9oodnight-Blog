import { createClient } from "@/lib/supabase/server"
import { normalizeSearchQuery } from "@/lib/shared/security"
import type { PostOption } from "@/lib/types"

export async function listPostOptions(input: {
  q?: string
  limit?: number
}): Promise<PostOption[]> {
  const supabase = await createClient()
  const safeQuery = normalizeSearchQuery(input.q ?? "")
  const limit = Math.max(1, Math.min(input.limit ?? 30, 100))

  let query = supabase
    .from("posts")
    .select("id, slug, title, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (safeQuery) {
    query = query.ilike("title", `%${safeQuery}%`)
  }

  const { data, error } = await query
  if (error) {
    throw error
  }

  return (data as PostOption[] | null) || []
}
