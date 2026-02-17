import type React from "react"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { DEFAULT_IMAGES } from "@/lib/constants"
import { useLocalDraft } from "@/features/editor/hooks/useLocalDraft"
import { MARKDOWN_IMPORT_STORAGE_KEY, parseMarkdownImportPayload } from "@/lib/shared/markdown-import"
import { toSlug } from "@/lib/shared/slug"
import { isSafeStoragePath } from "@/lib/shared/storage"
import {
  MAX_EXCERPT_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_CONTENT_LENGTH,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  normalizeUploadTag,
  sanitizeTags,
  sanitizeInputText,
  normalizeSeriesSlug,
  isMissingRelationError,
} from "@/features/editor/lib/post-validation"

export interface Attachment {
  filename: string
  url: string
  filePath: string
}

export interface DraftPayload {
  title: string
  category: string
  excerpt: string
  content: string
  slug: string
  tags: string[]
  imageUrl: string
  featuredImagePath: string | null
  attachments: Attachment[]
  seriesTitle: string
  seriesSlug: string
  seriesPosition: string
}

export function usePostForm() {
  const searchParams = useSearchParams()
  const postId = searchParams.get("id")
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [slug, setSlug] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [seriesTitle, setSeriesTitle] = useState("")
  const [seriesSlug, setSeriesSlug] = useState("")
  const [seriesPosition, setSeriesPosition] = useState("")
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGES.THUMBNAIL)
  const [featuredImagePath, setFeaturedImagePath] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isPostLoading, setIsPostLoading] = useState(false)
  const [isAuthorizedPost, setIsAuthorizedPost] = useState(false)
  const importedMarkdownAppliedRef = useRef(false)

  const supabase = useMemo(() => createClient(), [])
  const isEditMode = postId !== null
  const draftStorageKey = useMemo(
    () => (isEditMode ? `editor:draft:${postId}` : "editor:draft:new"),
    [isEditMode, postId]
  )

  const draftPayload = useMemo<DraftPayload>(
    () => ({
      title,
      category,
      excerpt,
      content,
      slug,
      tags,
      imageUrl,
      featuredImagePath,
      attachments,
      seriesTitle,
      seriesSlug,
      seriesPosition,
    }),
    [
      title,
      category,
      excerpt,
      content,
      slug,
      tags,
      imageUrl,
      featuredImagePath,
      attachments,
      seriesTitle,
      seriesSlug,
      seriesPosition,
    ]
  )

  const applyDraftPayload = useCallback((draft: DraftPayload) => {
    setTitle(draft.title || "")
    setCategory(draft.category || "")
    setExcerpt(draft.excerpt || "")
    setSlug(draft.slug || "")
    setContent(draft.content || "")
    setTags(sanitizeTags(draft.tags || []))
    setImageUrl(draft.imageUrl || DEFAULT_IMAGES.THUMBNAIL)
    setFeaturedImagePath(draft.featuredImagePath || null)
    setAttachments((draft.attachments || []).filter((file) => isSafeStoragePath(file.filePath)))
    setSeriesTitle(draft.seriesTitle || "")
    setSeriesSlug(draft.seriesSlug || "")
    setSeriesPosition(draft.seriesPosition || "")
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUserId(user.id)
    }
    checkUser()
  }, [supabase, router])

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId || !userId) {
        return
      }

      setIsPostLoading(true)
      setIsAuthorizedPost(false)
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .eq("author_id", userId)
        .maybeSingle()

      if (!data) {
        setIsPostLoading(false)
        if (error) {
          toast.error(`Error: ${error.message}`)
        } else {
          toast.error("권한이 없거나 존재하지 않는 글입니다.")
          router.push("/")
        }
        return
      }

      if (error) {
        setIsPostLoading(false)
        toast.error(`Error: ${error.message}`)
        return
      }

      setIsAuthorizedPost(true)
      setTitle(data.title || "")
      setCategory(data.category || "")
      setExcerpt(sanitizeInputText(data.excerpt || "", MAX_EXCERPT_LENGTH))
      setContent(data.content || "")
      setSlug(data.slug || toSlug(data.title || ""))
      setTags(sanitizeTags(data.tags || []))
      setImageUrl(data.image_url || DEFAULT_IMAGES.THUMBNAIL)
      setFeaturedImagePath(
        isSafeStoragePath(data.featured_image_path || "")
          ? data.featured_image_path
          : null
      )
      setAttachments(((data.attachments || []) as Attachment[]).filter((attachment) =>
        isSafeStoragePath(attachment?.filePath || "")
      ))

      const { data: seriesData, error: seriesError } = await supabase
        .from("post_series_items")
        .select("series_title, series_slug, position")
        .eq("post_id", postId)
        .maybeSingle()

      if (!seriesError && seriesData) {
        setSeriesTitle(seriesData.series_title || "")
        setSeriesSlug(seriesData.series_slug || "")
        setSeriesPosition(
          typeof seriesData.position === "number" ? String(seriesData.position) : ""
        )
      } else if (seriesError && !isMissingRelationError(seriesError)) {
        console.error("Failed to load series metadata:", seriesError)
      }

      setIsPostLoading(false)
    }

    if (isEditMode) {
      fetchPost()
    } else {
      setIsAuthorizedPost(true)
    }
  }, [postId, isEditMode, userId, supabase, router])

  const isEditorReady = !isEditMode || !isPostLoading

  const buildUniqueSlug = useCallback(async (inputSlug: string): Promise<string> => {
    const baseSlug = inputSlug || "untitled"
    let candidate = baseSlug

    for (let i = 1; i <= 20; i += 1) {
      const query = supabase
        .from("posts")
        .select("id")
        .eq("slug", candidate)

      const { data: slugRows, error } = await query
        .order("id")
        .limit(10)

      if (error) {
        throw error
      }

      const conflictingIds = ((slugRows as { id: string }[] | null) || [])
        .map((row) => row.id)
        .filter(Boolean)
        .filter((id) => id !== postId)

      if (conflictingIds.length === 0) {
        return candidate
      }

      candidate = `${baseSlug}-${i + 1}`
    }

    return `${baseSlug}-${Date.now()}`
  }, [postId, supabase])

  const {
    recoverableDraft,
    isAutoSaving,
    lastAutoSavedAt,
    restoreDraft,
    dismissRecoveredDraft,
    deleteRecoveredDraft,
    clearDraft,
  } = useLocalDraft<DraftPayload>({
    storageKey: draftStorageKey,
    isReady: isEditorReady,
    payload: draftPayload,
    hasMeaningfulContent: (payload) =>
      Boolean(
        payload.title.trim() ||
          payload.excerpt.trim() ||
          payload.content.trim() ||
          payload.tags.length > 0 ||
          payload.attachments.length > 0 ||
          payload.seriesTitle.trim()
      ),
    onRestore: applyDraftPayload,
  })

  useEffect(() => {
    if (isEditMode || importedMarkdownAppliedRef.current) {
      return
    }

    if (typeof window === "undefined") {
      return
    }

    const rawPayload = window.localStorage.getItem(MARKDOWN_IMPORT_STORAGE_KEY)
    importedMarkdownAppliedRef.current = true

    if (!rawPayload) {
      return
    }

    window.localStorage.removeItem(MARKDOWN_IMPORT_STORAGE_KEY)

    const parsedPayload = parseMarkdownImportPayload(rawPayload)
    if (!parsedPayload) {
      toast.error("Failed to parse markdown preset.")
      return
    }

    const hasExistingContent = Boolean(
      title.trim() ||
        excerpt.trim() ||
        content.trim() ||
        tags.length > 0 ||
        attachments.length > 0 ||
        seriesTitle.trim() ||
        seriesSlug.trim() ||
        seriesPosition.trim()
    )

    if (hasExistingContent) {
      return
    }

    setTitle(sanitizeInputText(parsedPayload.title, MAX_TITLE_LENGTH))
    setExcerpt(sanitizeInputText(parsedPayload.excerpt, MAX_EXCERPT_LENGTH))
    setContent(sanitizeInputText(parsedPayload.body, MAX_CONTENT_LENGTH))
    toast.success("Markdown preset imported.")
  }, [
    isEditMode,
    title,
    excerpt,
    content,
    tags.length,
    attachments.length,
    seriesTitle,
    seriesSlug,
    seriesPosition,
  ])

  const handleContentChange = useCallback((nextContent: string) => {
    const trimmed = nextContent.trim()
    if (trimmed.startsWith("[")) {
      setContent((prev) => (prev === nextContent ? prev : nextContent))
      return
    }

    if (!nextContent.includes("'''")) {
      setContent((prev) => (prev === nextContent ? prev : nextContent))
      return
    }

    const lines = nextContent.split("\n")
    let updated = false
    const updatedLines = lines.map((line) => {
      if (line.trim() === "'''") {
        updated = true
        return "```"
      }
      return line
    })

    const normalized = updated ? updatedLines.join("\n") : nextContent
    setContent((prev) => (prev === normalized ? prev : normalized))
  }, [])

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault()
      const normalizedTag = normalizeUploadTag(currentTag)
      if (normalizedTag && !tags.includes(normalizedTag) && tags.length < MAX_TAGS) {
        setTags([...tags, normalizedTag])
      }
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handlePreview = () => {
    const previewData = { ...draftPayload, postId }
    localStorage.setItem("previewData", JSON.stringify(previewData))
    window.location.href = "/edit/preview"
  }

  const handleRestoreDraft = () => {
    if (restoreDraft()) {
      toast.success("Saved draft restored.")
    }
  }

  const handleDismissRecoveredDraft = () => {
    dismissRecoveredDraft()
  }

  const handleDeleteRecoveredDraft = () => {
    deleteRecoveredDraft()
    toast.success("Local draft deleted.")
  }

  return {
    // Router / IDs
    postId,
    router,
    supabase,
    isEditMode,

    // Form state
    title, setTitle,
    category, setCategory,
    excerpt, setExcerpt,
    content, setContent,
    slug, setSlug,
    tags, setTags,
    currentTag, setCurrentTag,
    seriesTitle, setSeriesTitle,
    seriesSlug, setSeriesSlug,
    seriesPosition, setSeriesPosition,
    imageUrl, setImageUrl,
    featuredImagePath, setFeaturedImagePath,
    attachments, setAttachments,
    fileToDelete, setFileToDelete,
    showDeletePostDialog, setShowDeletePostDialog,
    isUploading, setIsUploading,
    isSubmitting, setIsSubmitting,
    showPreview, setShowPreview,
    userId,
    isPostLoading,
    isAuthorizedPost,

    // Derived
    isEditorReady,
    draftPayload,

    // Draft management
    recoverableDraft,
    isAutoSaving,
    lastAutoSavedAt,
    clearDraft,

    // Handlers
    buildUniqueSlug,
    handleContentChange,
    handleTagKeyDown,
    removeTag,
    handlePreview,
    handleRestoreDraft,
    handleDismissRecoveredDraft,
    handleDeleteRecoveredDraft,
  }
}
