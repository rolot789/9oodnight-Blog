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
  let slugError: { message: string } | null = null

  if (lookupIdentifiers.length > 0) {
    const slugQuery = supabase
      .from("posts")
      .select("*")

    const { data: postBySlugRaw, error: slugLookupError } = await (lookupIdentifiers.length === 1
      ? slugQuery.eq("slug", lookupIdentifiers[0]).maybeSingle()
      : slugQuery.in("slug", lookupIdentifiers).maybeSingle())

    slugError = slugLookupError

    if (!slugLookupError && postBySlugRaw) {
      postBySlug = postBySlugRaw as Post
    }

    if (!postBySlug) {
      for (const candidate of lookupIdentifiers) {
        const { data: fallbackPost, error: fallbackError } = await supabase
          .from("posts")
          .select("*")
          .ilike("slug", candidate)
          .maybeSingle()

        if (!fallbackError && fallbackPost) {
          postBySlug = fallbackPost as Post
          break
        }
      }
    }
  }

  if (postBySlug) {
    return postBySlug
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[getPostByIdentifier] slug lookup miss", {
      identifier,
      lookupIdentifiers,
      slugError: slugError ? slugError.message : null,
    })
  }

  const hasUuidCandidate = lookupIdentifiers.some((value) => isUuid(value))
  if (!hasUuidCandidate) {
    return null
  }

  const candidateUuid = lookupIdentifiers.find((value) => isUuid(value)) ?? identifier

  const { data: postById, error: idError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", candidateUuid)
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

  const appendVariants = (value: string) => {
    appendCandidate(value)

    const withoutQuery = value.split("?")[0].split("#")[0]
    appendCandidate(withoutQuery)

    const withoutLeadingSlash = withoutQuery.replace(/^\/+/, "").replace(/\/+$/, "")
    appendCandidate(withoutLeadingSlash)

    const withoutPostPrefix = withoutLeadingSlash.replace(/^post\//i, "")
    appendCandidate(withoutPostPrefix)

    const lastSegment = withoutPostPrefix.split("/").pop() || ""
    appendCandidate(lastSegment)

    if (withoutLeadingSlash !== withoutPostPrefix) {
      const postSegment = withoutLeadingSlash.split("/post/").pop() || ""
      appendCandidate(postSegment)
    }

    const normalized = withoutPostPrefix
      .normalize("NFKC")
      .trim()
      .toLowerCase()
    appendCandidate(normalized)

    const lowerLastSegment = lastSegment
      .normalize("NFKC")
      .trim()
      .toLowerCase()
    appendCandidate(lowerLastSegment)
  }

  appendVariants(identifier)

  try {
    appendVariants(decodeURIComponent(identifier))
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getPostByIdentifier] decodeURIComponent failed", {
        identifier,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  appendVariants(identifier.normalize("NFKC"))
  try {
    appendVariants(decodeURIComponent(identifier).normalize("NFKC"))
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
