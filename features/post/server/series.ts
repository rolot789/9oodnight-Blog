import { createClient } from "@/lib/supabase/server"
import type { SeriesContext, SeriesMembership } from "@/lib/types"

interface SeriesRow {
  post_id: string
  series_slug: string
  series_title: string
  position: number | null
}

interface SeriesPostRow {
  id: string
  title: string
  created_at: string
}

function isMissingSeriesTable(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }
  const code = "code" in error ? String((error as { code?: string }).code ?? "") : ""
  return code === "42P01"
}

function normalizeSeriesSlug(input: string): string {
  return input
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

function sortSeriesRows(rows: SeriesRow[], postsById: Map<string, SeriesPostRow>): SeriesRow[] {
  return [...rows].sort((a, b) => {
    if (a.position !== null && b.position !== null && a.position !== b.position) {
      return a.position - b.position
    }
    if (a.position === null && b.position !== null) {
      return 1
    }
    if (a.position !== null && b.position === null) {
      return -1
    }

    const postA = postsById.get(a.post_id)
    const postB = postsById.get(b.post_id)
    if (postA && postB) {
      const byDate = new Date(postA.created_at).getTime() - new Date(postB.created_at).getTime()
      if (byDate !== 0) {
        return byDate
      }
      return postA.title.localeCompare(postB.title)
    }

    return a.post_id.localeCompare(b.post_id)
  })
}

export function buildSeriesSlug(seriesTitle: string): string {
  return normalizeSeriesSlug(seriesTitle)
}

export async function getSeriesMembership(postId: string): Promise<SeriesMembership | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("post_series_items")
    .select("post_id, series_slug, series_title, position")
    .eq("post_id", postId)
    .maybeSingle()

  if (error) {
    if (isMissingSeriesTable(error)) {
      return null
    }
    throw error
  }

  if (!data) {
    return null
  }

  return data as SeriesMembership
}

export async function upsertSeriesMembership(input: {
  postId: string
  seriesTitle: string
  seriesSlug?: string
  position: number | null
}): Promise<void> {
  const supabase = await createClient()
  const safeTitle = input.seriesTitle.trim().slice(0, 120)
  if (!safeTitle) {
    return
  }

  const safeSlug = normalizeSeriesSlug(input.seriesSlug || safeTitle)
  if (!safeSlug) {
    return
  }

  const { error } = await supabase
    .from("post_series_items")
    .upsert(
      {
        post_id: input.postId,
        series_slug: safeSlug,
        series_title: safeTitle,
        position: input.position,
      },
      { onConflict: "post_id" }
    )

  if (error && !isMissingSeriesTable(error)) {
    throw error
  }
}

export async function deleteSeriesMembership(postId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("post_series_items")
    .delete()
    .eq("post_id", postId)

  if (error && !isMissingSeriesTable(error)) {
    throw error
  }
}

export async function getSeriesContext(postId: string): Promise<SeriesContext | null> {
  const membership = await getSeriesMembership(postId)
  if (!membership) {
    return null
  }

  const supabase = await createClient()
  const { data: seriesRowsRaw, error: seriesRowsError } = await supabase
    .from("post_series_items")
    .select("post_id, series_slug, series_title, position")
    .eq("series_slug", membership.series_slug)

  if (seriesRowsError) {
    if (isMissingSeriesTable(seriesRowsError)) {
      return null
    }
    throw seriesRowsError
  }

  const seriesRows = (seriesRowsRaw as SeriesRow[] | null) || []
  if (seriesRows.length === 0) {
    return null
  }

  const ids = seriesRows.map((row) => row.post_id)
  const { data: postsRaw, error: postsError } = await supabase
    .from("posts")
    .select("id, title, created_at")
    .in("id", ids)

  if (postsError) {
    throw postsError
  }

  const posts = (postsRaw as SeriesPostRow[] | null) || []
  const postsById = new Map(posts.map((post) => [post.id, post]))

  const sortedRows = sortSeriesRows(
    seriesRows.filter((row) => postsById.has(row.post_id)),
    postsById
  )

  const index = sortedRows.findIndex((row) => row.post_id === postId)
  if (index === -1) {
    return null
  }

  const previousRow = index > 0 ? sortedRows[index - 1] : null
  const nextRow = index < sortedRows.length - 1 ? sortedRows[index + 1] : null

  return {
    slug: membership.series_slug,
    title: membership.series_title,
    total: sortedRows.length,
    index: index + 1,
    previous: previousRow
      ? {
          postId: previousRow.post_id,
          title: postsById.get(previousRow.post_id)?.title || "Untitled",
          position: previousRow.position,
        }
      : null,
    next: nextRow
      ? {
          postId: nextRow.post_id,
          title: postsById.get(nextRow.post_id)?.title || "Untitled",
          position: nextRow.position,
        }
      : null,
  }
}
