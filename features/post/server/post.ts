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

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return uuidPattern.test(value)
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

export const getPostByIdentifier = cache(async (identifier: string): Promise<Post | null> => {
  const supabase = await createClient()
  const lookupIdentifiers = getPostLookupIdentifiers(identifier)
  let postBySlug: Post | null = null

  const slugQuery = supabase
    .from("posts")
    .select("*")

  const { data: postBySlugRaw, error: slugError } = await (lookupIdentifiers.length === 1
    ? slugQuery.eq("slug", lookupIdentifiers[0]).maybeSingle()
    : slugQuery.in("slug", lookupIdentifiers).maybeSingle())

  if (!slugError && postBySlugRaw) {
    postBySlug = postBySlugRaw as Post
  }

  if (!slugError && postBySlug) {
    return postBySlug
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[getPostByIdentifier] slug lookup miss", {
      identifier,
      lookupIdentifiers,
      slugError: slugError ? slugError.message : null,
    })
  }

  if (!isUuid(identifier)) {
    return null
  }

  const { data: postById, error: idError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", identifier)
    .maybeSingle()

  if (idError || !postById) {
    return null
  }

  return postById as Post
})

export function getPostLookupIdentifiers(identifier: string): string[] {
  const candidates = new Set<string>()
  const appendCandidate = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }
    candidates.add(trimmed)
  }

  appendCandidate(identifier)

  try {
    appendCandidate(decodeURIComponent(identifier))
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getPostByIdentifier] decodeURIComponent failed", {
        identifier,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  appendCandidate(identifier.normalize("NFKC"))
  try {
    appendCandidate(decodeURIComponent(identifier).normalize("NFKC"))
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getPostByIdentifier] normalized decode failed", {
        identifier,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return Array.from(candidates)
}

export async function getPostPageData(identifier: string): Promise<PostPageData> {
  const supabase = await createClient()

  const [userResult, post] = await Promise.all([
    supabase.auth.getUser().catch(() => null),
    getPostByIdentifier(identifier).catch(() => null),
  ])

  const resolvedPostId = post?.id

  const [seriesContext, linkedTodos] = resolvedPostId
    ? await Promise.all([
        getSeriesContext(resolvedPostId).catch(() => null),
        listTodosByPost(resolvedPostId, 12).catch(() => []),
      ])
    : [null, []]

  return {
    user: userResult?.data.user ?? null,
    post,
    seriesContext,
    linkedTodos,
  }
}
