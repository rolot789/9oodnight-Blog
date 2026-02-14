"use client"

import type React from "react"
import { useEffect, useState, useMemo, Suspense, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Paperclip, Trash2, UploadCloud, Eye, EyeOff, X, Edit2, Download, Columns, Image, Hash, FileText, Calendar, Tag } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import TableOfContents from "@/features/post/components/TableOfContents"
import { POST_CATEGORIES as categories, DEFAULT_IMAGES } from "@/lib/constants"
import { useLocalDraft } from "@/features/editor/hooks/useLocalDraft"
import { MARKDOWN_IMPORT_STORAGE_KEY, parseMarkdownImportPayload } from "@/lib/shared/markdown-import"

const RealtimePreview = dynamic(() => import("@/features/editor/components/RealtimePreview"), {
  ssr: false,
})

const BlockEditor = dynamic(() => import("@/features/editor/components/BlockEditor"), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[400px] border border-[#e5e5e5] bg-white flex items-center justify-center">
      <span className="text-[#8b8c89] text-sm">에디터 로딩 중...</span>
    </div>
  ),
})

interface Attachment {
  filename: string
  url: string
  filePath: string
}

interface DraftPayload {
  title: string
  category: string
  excerpt: string
  content: string
  tags: string[]
  imageUrl: string
  featuredImagePath: string | null
  attachments: Attachment[]
  seriesTitle: string
  seriesSlug: string
  seriesPosition: string
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

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }
  const code = "code" in error ? String((error as { code?: string }).code ?? "") : ""
  return code === "42P01" || code === "42703"
}

function EditFormContent() {
  const searchParams = useSearchParams()
  const postId = searchParams.get("id")
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
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
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isPostLoading, setIsPostLoading] = useState(false)
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
    setContent(draft.content || "")
    setTags(draft.tags || [])
    setImageUrl(draft.imageUrl || DEFAULT_IMAGES.THUMBNAIL)
    setFeaturedImagePath(draft.featuredImagePath || null)
    setAttachments(draft.attachments || [])
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      
      setUserRole(profile?.role || "user")
    }
    checkUser()
  }, [supabase, router])

  useEffect(() => {
    const fetchPost = async () => {
      if (postId) {
        setIsPostLoading(true)
        const { data, error } = await supabase.from("posts").select("*", { count: 'exact' }).eq("id", postId).single()
        if (error) {
          toast.error(`Error: ${error.message}`)
        } else if (data) {
          setTitle(data.title)
          setCategory(data.category)
          setExcerpt(data.excerpt)
          setContent(data.content)
          setTags(data.tags || [])
          setImageUrl(data.image_url || DEFAULT_IMAGES.THUMBNAIL)
          setFeaturedImagePath(data.featured_image_path || null)
          setAttachments(data.attachments || [])

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
        }
        setIsPostLoading(false)
      }
    }
    if (isEditMode) {
      fetchPost()
    }
  }, [postId, isEditMode, supabase, router])

  const isEditorReady = !isEditMode || !isPostLoading

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

    setTitle(parsedPayload.title)
    setExcerpt(parsedPayload.excerpt)
    setContent(parsedPayload.body)
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

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault()
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()])
      }
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleDelete = async () => {
    if (!postId) return

    setIsSubmitting(true)

    // Delete attachments
    if (attachments.length > 0) {
      const filePaths = attachments.map(file => file.filePath);
      const { error: storageError } = await supabase.storage.from('files').remove(filePaths);
      if (storageError) {
        toast.error(`Failed to delete attachments: ${storageError.message}`);
        // Continue to delete post even if attachments fail, or return? 
        // Best effort usually.
      }
    }

    // Delete featured image
    if (featuredImagePath) {
      const { error: imageDeleteError } = await supabase.storage.from('files').remove([featuredImagePath]);
      if (imageDeleteError) {
        console.error("Failed to delete featured image:", imageDeleteError);
        // Toast optional, maybe just log
      }
    }

    const { error: seriesDeleteError } = await supabase
      .from("post_series_items")
      .delete()
      .eq("post_id", postId)

    if (seriesDeleteError && !isMissingRelationError(seriesDeleteError)) {
      console.error("Failed to delete series membership:", seriesDeleteError)
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId)

    if (error) {
      toast.error(`Error: ${error.message}`)
      setIsSubmitting(false)
    } else {
      clearDraft()
      router.push("/")
      router.refresh()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    const file = e.target.files[0]
    
    const fileExt = file.name.split('.').pop()
    const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
    const safeFileName = fileNameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')
    const finalName = safeFileName.length > 0 ? safeFileName : 'file'
    
    const filePath = `${Date.now()}_${finalName}.${fileExt}`

    setIsUploading(true)

    const { error } = await supabase.storage.from("files").upload(filePath, file)

    if (error) {
      toast.error(`Upload error: ${error.message}`)
    } else {
      const { data: { publicUrl } } = supabase.storage.from("files").getPublicUrl(filePath)
      setAttachments((current) => [
        ...current,
        { filename: file.name, url: publicUrl, filePath },
      ])
    }
    setIsUploading(false)
  }

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    const file = e.target.files[0]
    
    // Check file type (optional but good)
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.")
      return
    }

    const fileExt = file.name.split('.').pop()
    const filePath = `featured_${Date.now()}.${fileExt}`

    setIsUploading(true)

    // If there is an existing featured image, we might want to delete it or just overwrite reference.
    // Let's delete the old one to keep storage clean if we have the path.
    if (featuredImagePath) {
      await supabase.storage.from('files').remove([featuredImagePath])
    }

    const { error } = await supabase.storage.from("files").upload(filePath, file)

    if (error) {
      toast.error(`Upload error: ${error.message}`)
    } else {
      const { data: { publicUrl } } = supabase.storage.from("files").getPublicUrl(filePath)
      setImageUrl(publicUrl)
      setFeaturedImagePath(filePath)
    }
    setIsUploading(false)
  }

  const handleFeaturedImageRemove = async () => {
    if (!featuredImagePath) {
      setImageUrl(DEFAULT_IMAGES.THUMBNAIL)
      return
    }

    setIsUploading(true)
    const { error } = await supabase.storage.from('files').remove([featuredImagePath])
    
    if (error) {
      toast.error(`Failed to remove image: ${error.message}`)
      setIsUploading(false)
      return
    }

    setImageUrl(DEFAULT_IMAGES.THUMBNAIL)
    setFeaturedImagePath(null)
    setIsUploading(false)
  }

  const handleFileDelete = (filePath: string) => {
    setFileToDelete(filePath)
  }

  const executeFileDelete = async () => {
    if (!fileToDelete) return

    const filePathToDelete = fileToDelete
    setAttachments((current) => current.filter((att) => att.filePath !== filePathToDelete))
    setFileToDelete(null)

    const { error } = await supabase.storage.from('files').remove([filePathToDelete])
    
    if (error) {
      toast.error(`Failed to delete file: ${error.message}`)
    }
  }

  const handleContentChange = useCallback((nextContent: string) => {
    if (!nextContent.includes("'''")) {
      setContent((prev) => (prev === nextContent ? prev : nextContent))
      return
    }

    // Auto-convert ''' to ``` for code blocks
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const postData = {
      title,
      category,
      excerpt,
      content,
      tags,
      image_url: imageUrl || DEFAULT_IMAGES.THUMBNAIL,
      featured_image_path: featuredImagePath,
      attachments,
      read_time: `${Math.max(1, Math.ceil(content.split(" ").length / 200))} min`,
    }

    let error
    let savedPostId = postId

    if (isEditMode) {
      const { data: updatedRow, error: updateError } = await supabase
        .from("posts")
        .update(postData)
        .eq("id", postId)
        .select("id")
        .single()
      error = updateError
      savedPostId = updatedRow?.id ?? postId
    } else {
      const { data: insertedRow, error: insertError } = await supabase
        .from("posts")
        .insert({ ...postData, author_id: userId })
        .select("id")
        .single()
      error = insertError
      savedPostId = insertedRow?.id ?? null
    }

    if (error) {
      toast.error(`Error: ${error.message}`)
    } else {
      if (savedPostId) {
        try {
          const safeSeriesTitle = seriesTitle.trim().slice(0, 120)
          if (safeSeriesTitle) {
            const safeSeriesSlug = normalizeSeriesSlug(seriesSlug || safeSeriesTitle)
            const parsedPosition = Number.parseInt(seriesPosition, 10)
            const safePosition = Number.isNaN(parsedPosition) ? null : Math.max(1, parsedPosition)

            const { error: upsertSeriesError } = await supabase
              .from("post_series_items")
              .upsert(
                {
                  post_id: savedPostId,
                  series_title: safeSeriesTitle,
                  series_slug: safeSeriesSlug || normalizeSeriesSlug(safeSeriesTitle),
                  position: safePosition,
                },
                { onConflict: "post_id" }
              )
            if (upsertSeriesError && !isMissingRelationError(upsertSeriesError)) {
              throw upsertSeriesError
            }
          } else {
            const { error: deleteSeriesError } = await supabase
              .from("post_series_items")
              .delete()
              .eq("post_id", savedPostId)
            if (deleteSeriesError && !isMissingRelationError(deleteSeriesError)) {
              throw deleteSeriesError
            }
          }
        } catch (seriesError) {
          if (!isMissingRelationError(seriesError)) {
            console.error("Series metadata save failed:", seriesError)
            toast.error("Post is saved, but series metadata update failed.")
          }
        }
      }

      clearDraft()

      toast.success(`Post ${isEditMode ? "updated" : "published"} successfully!`)
      if (isEditMode && savedPostId) {
        router.push(`/post/${savedPostId}`)
        router.refresh()
      } else {
        router.push("/")
        router.refresh()
      }
    }

    setIsSubmitting(false)
  }

  return (
    <div className={`mx-auto px-6 transition-all duration-300 pb-20 ${showPreview ? "max-w-[95vw]" : "max-w-5xl"}`}>
      {/* Top Navigation & Toggle */}
      <div className="mb-4 flex items-center justify-between py-4 border-b border-[#e5e5e5]">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </a>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-[10px] tracking-wider text-[#8b8c89]">
            {isAutoSaving
              ? "AUTOSAVING..."
              : lastAutoSavedAt
                ? `AUTOSAVED ${new Date(lastAutoSavedAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "AUTOSAVE READY"}
          </div>
          {isEditMode && (
            <button 
              type="button" 
              onClick={() => setShowDeletePostDialog(true)}
              className="text-xs tracking-wider text-red-500 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          )}
          <Toggle 
            pressed={showPreview} 
            onPressedChange={setShowPreview}
            className="flex items-center gap-2 border border-[#080f18] bg-transparent px-6 py-3 text-xs tracking-wider text-[#080f18] transition-all hover:border-[#6096ba] hover:text-[#6096ba] data-[state=on]:border-[#080f18] data-[state=on]:bg-transparent data-[state=on]:text-[#080f18] rounded-none"
            aria-label="Toggle Split Preview"
          >
            {showPreview ? <Columns className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{showPreview ? "Split" : "Preview"}</span>
          </Toggle>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading} 
            className="border border-[#080f18] bg-transparent px-6 py-3 text-xs tracking-wider text-[#080f18] transition-all hover:border-[#6096ba] hover:text-[#6096ba] disabled:opacity-50 disabled:hover:border-[#080f18] disabled:hover:text-[#080f18] rounded-none"
          >
            {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {recoverableDraft && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-[#e5e5e5] bg-white px-4 py-3">
          <div>
            <p className="text-sm text-[#080f18]">A local draft is available.</p>
            <p className="text-[11px] tracking-wider text-[#8b8c89]">
              {recoverableDraft.updatedAt
                ? `Saved at ${new Date(recoverableDraft.updatedAt).toLocaleString("en-US")}`
                : "Saved recently on this browser"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="border border-[#080f18] bg-[#080f18] px-3 py-1.5 text-[11px] tracking-wider text-white transition-colors hover:bg-[#1a2632]"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={handleDismissRecoveredDraft}
              className="border border-[#e5e5e5] px-3 py-1.5 text-[11px] tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]"
            >
              Keep Current
            </button>
            <button
              type="button"
              onClick={handleDeleteRecoveredDraft}
              className="border border-[#e5e5e5] px-3 py-1.5 text-[11px] tracking-wider text-red-600 transition-colors hover:border-red-600"
            >
              Delete Draft
            </button>
          </div>
        </div>
      )}

      <div className={`grid gap-8 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        
        {/* Left Column: Notion-style Edit Form */}
        <div className="space-y-1 h-full">
          
          {/* Cover Image - 노션 스타일 */}
          <div className="relative group mb-6">
            {imageUrl && imageUrl !== DEFAULT_IMAGES.THUMBNAIL ? (
              <div className="relative h-[200px] w-full overflow-hidden rounded-none bg-gray-100">
                <img src={imageUrl} alt="Cover" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button 
                    type="button" 
                    onClick={handleFeaturedImageRemove} 
                    className="bg-white/90 hover:bg-white text-[#080f18] px-3 py-1.5 rounded-none text-xs font-medium transition-all"
                  >
                    Remove Cover
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex h-[80px] w-full cursor-pointer items-center justify-center gap-2 rounded-none border-2 border-dashed border-[#e5e5e5] bg-[#fafafa] text-sm text-[#8b8c89] transition-colors hover:border-[#6096ba] hover:bg-white group">
                <Image className="h-5 w-5 text-[#c0c0c0] group-hover:text-[#6096ba]" />
                <span className="group-hover:text-[#080f18]">Add Cover Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFeaturedImageUpload} disabled={isUploading} />
              </label>
            )}
          </div>

          {/* Title - 노션 스타일 대형 인라인 입력 */}
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Untitled" 
            required 
            className="w-full bg-transparent text-4xl font-bold text-[#080f18] placeholder-[#c0c0c0] outline-none border-none py-2 mb-2"
          />

          {/* Meta Properties - 노션 스타일 속성 */}
          <div className="space-y-2 py-4 border-b border-[#e5e5e5] mb-6">
            {/* Category Property */}
            <div className="flex items-center gap-3 py-1.5 px-2 rounded-none hover:bg-[#f5f5f5] transition-colors group">
              <div className="flex items-center gap-2 w-28 text-[#8b8c89]">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Category</span>
              </div>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="flex-1 border-none shadow-none bg-transparent hover:bg-[#e5e5e5] h-8 text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Series Property */}
            <div className="flex items-start gap-3 py-1.5 px-2 rounded-none hover:bg-[#f5f5f5] transition-colors">
              <div className="flex items-center gap-2 w-28 text-[#8b8c89] pt-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Series</span>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={seriesTitle}
                  onChange={(e) => {
                    const nextTitle = e.target.value
                    setSeriesTitle(nextTitle)
                    if (!seriesSlug.trim()) {
                      setSeriesSlug(normalizeSeriesSlug(nextTitle))
                    }
                  }}
                  placeholder="Series title (optional)"
                  className="w-full bg-transparent border-none outline-none text-sm text-[#080f18] placeholder-[#c0c0c0]"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={seriesSlug}
                      onChange={(e) => setSeriesSlug(normalizeSeriesSlug(e.target.value))}
                      placeholder="series-slug"
                      className="w-full bg-transparent border border-[#e5e5e5] px-2 py-1 text-xs text-[#080f18] placeholder-[#c0c0c0] outline-none focus:border-[#6096ba]"
                    />
                    <button
                      type="button"
                      onClick={() => setSeriesSlug(normalizeSeriesSlug(seriesTitle))}
                      className="border border-[#e5e5e5] px-2 py-1 text-[10px] tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]"
                    >
                      AUTO
                    </button>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={seriesPosition}
                    onChange={(e) => setSeriesPosition(e.target.value)}
                    placeholder="Order"
                    className="w-full bg-transparent border border-[#e5e5e5] px-2 py-1 text-xs text-[#080f18] placeholder-[#c0c0c0] outline-none focus:border-[#6096ba]"
                  />
                </div>
              </div>
            </div>

            {/* Tags Property */}
            <div className="flex items-start gap-3 py-1.5 px-2 rounded-none hover:bg-[#f5f5f5] transition-colors">
              <div className="flex items-center gap-2 w-28 text-[#8b8c89] pt-1">
                <Tag className="h-4 w-4" />
                <span className="text-sm">Tags</span>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5 items-center">
                  {tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 bg-[#e8f4fc] text-[#6096ba] px-2 py-0.5 rounded-none text-xs font-medium group"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? "Add tag..." : "+"}
                    className="bg-transparent border-none outline-none text-sm text-[#080f18] placeholder-[#c0c0c0] min-w-[60px] flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Excerpt Property */}
            <div className="flex items-start gap-3 py-1.5 px-2 rounded-none hover:bg-[#f5f5f5] transition-colors">
              <div className="flex items-center gap-2 w-28 text-[#8b8c89] pt-1">
                <Hash className="h-4 w-4" />
                <span className="text-sm">Excerpt</span>
              </div>
              <textarea 
                value={excerpt} 
                onChange={(e) => setExcerpt(e.target.value)} 
                placeholder="Write a short summary..." 
                required 
                rows={2} 
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#080f18] placeholder-[#c0c0c0] resize-none"
              />
            </div>
          </div>

          {/* Content Block Editor */}
          <div className="min-h-[500px]">
            <div className="text-xs text-[#8b8c89] mb-3 flex items-center gap-2">
              <span className="bg-[#f0f0f0] px-2 py-0.5 rounded-none text-[10px] font-medium">/</span>
              <span>to add blocks · Drag to reorder</span>
            </div>
            {isEditMode && isPostLoading ? (
              <div className="w-full min-h-[500px] border border-[#e5e5e5] bg-white rounded-none flex items-center justify-center">
                <div className="flex items-center gap-3 text-[#8b8c89]">
                  <div className="w-5 h-5 border-2 border-[#6096ba] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading content...</span>
                </div>
              </div>
            ) : (
              <BlockEditor
                key={isEditMode ? postId : 'new'}
                initialContent={content}
                onChange={handleContentChange}
                editable={true}
              />
            )}
          </div>

          {/* Attachments - 노션 스타일 */}
          <div className="pt-6 border-t border-[#e5e5e5] mt-8">
            <div className="flex items-center gap-2 mb-4 text-[#8b8c89]">
              <Paperclip className="h-4 w-4" />
              <span className="text-sm font-medium">Attachments</span>
            </div>
            <div className="space-y-2">
              {attachments.map((file) => (
                <div key={file.filePath} className="flex items-center justify-between rounded-none border border-[#e5e5e5] bg-[#fafafa] px-4 py-3 hover:bg-white transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-none bg-[#6096ba]/10 flex items-center justify-center">
                      <Paperclip className="h-4 w-4 text-[#6096ba]" />
                    </div>
                    <span className="text-sm text-[#080f18]">{file.filename}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleFileDelete(file.filePath)} 
                    className="opacity-0 group-hover:opacity-100 text-[#8b8c89] hover:text-red-600 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-none border-2 border-dashed border-[#e5e5e5] bg-[#fafafa] px-4 py-4 text-sm text-[#8b8c89] transition-colors hover:border-[#6096ba] hover:bg-white">
                <UploadCloud className="h-5 w-5" />
                {isUploading ? "Uploading..." : "Attach File"}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Realtime Preview (Visible only when showPreview is true) */}
        {showPreview && (
          <div className="hidden lg:block border-l border-[#e5e5e5] pl-8 h-full">
            <div className="sticky top-8 h-[calc(100vh-100px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              <article className="w-full pb-12">
                {/* Header Section */}
                <div>
                  {/* Category and Tags */}
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="bg-[#6096ba]/10 text-[#6096ba] px-2.5 py-1 text-xs font-medium rounded-none">
                      {category || "Uncategorized"}
                    </span>
                    {tags.map((tag) => (
                      <span key={tag} className="bg-[#f5f5f5] text-[#8b8c89] px-2 py-0.5 text-xs rounded-none">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="mb-4 text-3xl font-bold text-[#080f18]">{title || "Untitled"}</h1>

                  {/* Meta */}
                  <div className="mb-6 flex items-center gap-3 text-sm text-[#8b8c89]">
                    <span>Live Preview</span>
                    <span>·</span>
                    <span>{`${Math.max(1, Math.ceil(content.split(" ").length / 200))} min read`}</span>
                  </div>

                  {/* Excerpt */}
                  {excerpt && (
                    <p className="mb-6 text-[#8b8c89] italic border-l-2 border-[#6096ba] pl-4">{excerpt}</p>
                  )}

                  {/* Featured Image */}
                  {imageUrl && imageUrl !== DEFAULT_IMAGES.THUMBNAIL && (
                    <div className="relative mb-8 w-full overflow-hidden rounded-none">
                      <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div className="prose prose-lg max-w-none">
                  {content ? (
                    <RealtimePreview content={content} />
                  ) : (
                    <p className="text-[#8b8c89] italic">Start writing to see the preview...</p>
                  )}
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-[#e5e5e5]">
                    <h3 className="mb-4 text-sm font-medium text-[#8b8c89]">Attachments</h3>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={file.filePath || index}
                          className="flex items-center justify-between rounded-none border border-[#e5e5e5] bg-[#fafafa] p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Paperclip className="h-4 w-4 text-[#8b8c89]" />
                            <span className="text-sm text-[#080f18]">{file.filename}</span>
                          </div>
                          <Download className="h-4 w-4 text-[#8b8c89]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </div>
          </div>
        )}
      </div>

      {/* Delete Post Confirmation Dialog */}
      <Dialog open={showDeletePostDialog} onOpenChange={setShowDeletePostDialog}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setShowDeletePostDialog(false)} className="px-4 py-2 text-sm rounded-none border border-[#e5e5e5] hover:bg-[#f5f5f5] transition-colors">Cancel</button>
            <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm rounded-none transition-colors">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Attachment Confirmation Dialog */}
      <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Remove Attachment</DialogTitle>
            <DialogDescription>Are you sure you want to remove this file?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setFileToDelete(null)} className="px-4 py-2 text-sm rounded-none border border-[#e5e5e5] hover:bg-[#f5f5f5] transition-colors">Cancel</button>
            <button onClick={executeFileDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm rounded-none transition-colors">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function EditForm() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading editor...</div>}>
      <EditFormContent />
    </Suspense>
  )
}
