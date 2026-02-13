"use client"

import type React from "react"
import { useEffect, useState, useMemo, Suspense } from "react"
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

  const supabase = useMemo(() => createClient(), [])
  const isEditMode = postId !== null

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
        }
        setIsPostLoading(false)
      }
    }
    if (isEditMode) {
      fetchPost()
    }
  }, [postId, isEditMode, supabase, router])

  const handlePreview = () => {
    const previewData = { title, category, excerpt, content, imageUrl, attachments, tags, postId }
    localStorage.setItem("previewData", JSON.stringify(previewData))
    window.location.href = "/edit/preview"
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

    const { error } = await supabase.from("posts").delete().eq("id", postId)

    if (error) {
      toast.error(`Error: ${error.message}`)
      setIsSubmitting(false)
    } else {
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
      setAttachments([...attachments, { filename: file.name, url: publicUrl, filePath: filePath }])
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
    setAttachments(attachments.filter(att => att.filePath !== filePathToDelete))
    setFileToDelete(null)

    const { error } = await supabase.storage.from('files').remove([filePathToDelete])
    
    if (error) {
      toast.error(`Failed to delete file: ${error.message}`)
    }
  }

  const handleContentChange = (markdown: string) => {
    // Auto-convert ''' to ``` for code blocks
    const lines = markdown.split("\n")
    let updated = false
    const updatedLines = lines.map((line) => {
      if (line.trim() === "'''") {
        updated = true
        return "```"
      }
      return line
    })

    setContent(updated ? updatedLines.join("\n") : markdown)
  }

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

    if (isEditMode) {
      const { error: updateError } = await supabase.from("posts").update(postData).eq("id", postId)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from("posts").insert({ ...postData, author_id: userId })
      error = insertError
    }

    if (error) {
      toast.error(`Error: ${error.message}`)
    } else {
      toast.success(`Post ${isEditMode ? "updated" : "published"} successfully!`)
      if (isEditMode && postId) {
        router.push(`/post/${postId}`)
        router.refresh()
      } else {
        setTitle("")
        setCategory("")
        setExcerpt("")
        setContent("")
        setTags([])
        setImageUrl("")
        setFeaturedImagePath(null)
        setAttachments([])
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
            className="flex items-center gap-2 border border-[#e5e5e5] px-5 py-2 hover:bg-gray-50 data-[state=on]:bg-[#080f18] data-[state=on]:text-white transition-all rounded-none text-xs h-[34px]"
            aria-label="Toggle Split Preview"
          >
            {showPreview ? <Columns className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="font-medium">{showPreview ? "Split" : "Preview"}</span>
          </Toggle>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading} 
            className="bg-[#080f18] px-5 py-2 text-xs font-medium text-white transition-all hover:bg-[#1a2632] disabled:opacity-50 rounded-none h-[34px]"
          >
            {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Publish"}
          </button>
        </div>
      </div>

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
