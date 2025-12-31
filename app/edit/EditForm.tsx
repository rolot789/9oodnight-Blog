"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Paperclip, Trash2, UploadCloud, Eye, EyeOff, X, Edit2, Download, Columns } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import TableOfContents from "@/components/TableOfContents"

const RealtimePreview = dynamic(() => import("@/components/RealtimePreview"), {
  ssr: false,
})

const categories = ["Mathematics", "Development", "DevOps", "Computer Science", "Crypto", "Research"]

interface Attachment {
  filename: string
  url: string
  filePath: string
}

export default function EditForm() {
  const searchParams = useSearchParams()
  const postId = searchParams.get("id")
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const isEditMode = postId !== null

  useEffect(() => {
    const fetchPost = async () => {
      if (postId) {
        const { data, error } = await supabase.from("posts").select("*", { count: 'exact' }).eq("id", postId).single()
        if (error) {
          toast.error(`Error: ${error.message}`)
        } else if (data) {
          setTitle(data.title)
          setCategory(data.category)
          setExcerpt(data.excerpt)
          setContent(data.content)
          setTags(data.tags || [])
          setImageUrl(data.image_url || "")
          setAttachments(data.attachments || [])
        }
      }
    }
    if (isEditMode) {
      fetchPost()
    }
  }, [postId, isEditMode, supabase])

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

    if (attachments.length > 0) {
      const filePaths = attachments.map(file => file.filePath);
      const { error: storageError } = await supabase.storage.from('files').remove(filePaths);
      if (storageError) {
        toast.error(`Failed to delete attachments: ${storageError.message}`);
        setIsSubmitting(false);
        return;
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    
    const lines = newContent.split("\n")
    let updated = false
    const updatedLines = lines.map((line) => {
      if (line.trim() === "'''") {
        updated = true
        return "```"
      }
      return line
    })

    setContent(updated ? updatedLines.join("\n") : newContent)
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
      image_url: imageUrl || null,
      attachments,
      read_time: `${Math.max(1, Math.ceil(content.split(" ").length / 200))} min`,
    }

    let error

    if (isEditMode) {
      const { error: updateError } = await supabase.from("posts").update(postData).eq("id", postId)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from("posts").insert(postData)
      error = insertError
    }

    if (error) {
      toast.error(`Error: ${error.message}`)
    } else {
      toast.success(`Post ${isEditMode ? "updated" : "published"} successfully!`)
      if (!isEditMode) {
        setTitle("")
        setCategory("")
        setExcerpt("")
        setContent("")
        setTags([])
        setImageUrl("")
        setAttachments([])
      }
    }

    setIsSubmitting(false)
  }

  return (
    <div className={`mx-auto px-6 transition-all duration-300 pb-20 ${showPreview ? "max-w-[95vw]" : "max-w-3xl"}`}>
      {/* Top Navigation & Toggle */}
      <div className="mb-8 flex items-center justify-between py-6">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </a>

        <div className="flex items-center gap-4">
          <Toggle 
            pressed={showPreview} 
            onPressedChange={setShowPreview}
            className="flex items-center gap-2 border border-[#e5e5e5] px-4 py-2 hover:bg-gray-50 data-[state=on]:bg-[#080f18] data-[state=on]:text-white transition-all"
            aria-label="Toggle Split Preview"
          >
            {showPreview ? <Columns className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="text-[10px] font-bold tracking-widest">{showPreview ? "SPLIT VIEW" : "PREVIEW"}</span>
          </Toggle>
        </div>
      </div>

      <div className={`grid gap-12 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        
        {/* Left Column: Edit Form */}
        <div className="space-y-8 h-full">
          <h1 className="mb-8 text-2xl font-light tracking-wide text-[#080f18]">{isEditMode ? "EDIT POST" : "CREATE NEW POST"}</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="title" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">TITLE</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter post title..." required className="w-full border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]" />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="category" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">CATEGORY</label>
                <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full appearance-none border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] outline-none transition-colors focus:border-[#6096ba]">
                  <option value="">Select a category...</option>
                  {categories.map((cat) => ( <option key={cat} value={cat}>{cat}</option> ))}
                </select>
              </div>
              <div>
                <label htmlFor="imageUrl" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">FEATURED IMAGE URL</label>
                <input type="text" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]" />
              </div>
            </div>

            <div>
              <label htmlFor="excerpt" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">EXCERPT</label>
              <textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Write a short summary..." required rows={4} className="w-full resize-none border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]" />
            </div>

            <div>
              <label htmlFor="tags" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">TAGS</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full outline-none hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {tag} tag</span>
                    </button>
                  </Badge>
                ))}
              </div>
              <input
                type="text"
                id="tags"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type a tag and press Enter..."
                className="w-full border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]"
              />
            </div>

            <div className="flex flex-col h-full">
              <label htmlFor="content" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">CONTENT (MARKDOWN)</label>
              <textarea id="content" value={content} onChange={handleContentChange} placeholder="Write your post content here..." required rows={showPreview ? 35 : 20} className="w-full resize-none border border-[#e5e5e5] bg-white px-4 py-3 text-sm leading-relaxed font-mono text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]" />
            </div>

            <div>
              <label className="mb-2 block text-xs tracking-wider text-[#8b8c89]">ATTACHMENTS</label>
              <div className="space-y-3">
                {attachments.map((file) => (
                  <div key={file.filePath} className="flex items-center justify-between rounded border border-[#e5e5e5] bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-4 w-4 text-[#8b8c89]" />
                      <span className="text-sm text-[#080f18]">{file.filename}</span>
                    </div>
                    <button type="button" onClick={() => handleFileDelete(file.filePath)} className="text-[#8b8c89] hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded border border-[#e5e5e5] bg-white px-4 py-4 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]">
                  <UploadCloud className="h-4 w-4" />
                  {isUploading ? "UPLOADING..." : "UPLOAD ATTACHMENT"}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-8">
              {isEditMode && (
                <button 
                  type="button" 
                  onClick={() => {/* existing delete dialog trigger logic */}}
                  className="mr-auto text-xs tracking-wider text-red-600 hover:underline"
                >
                  DELETE POST
                </button>
              )}
              <a href="/" className="border border-[#e5e5e5] px-6 py-3 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]">Cancel</a>
              <button type="button" onClick={handlePreview} className="border border-[#e5e5e5] px-6 py-3 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]">Static Preview</button>
              <button 
                type="submit" 
                disabled={isSubmitting || isUploading} 
                className="bg-[#080f18] px-10 py-4 text-[10px] font-bold tracking-[0.2em] text-white transition-all hover:bg-[#1a2632] disabled:opacity-50"
              >
                {isSubmitting ? "PROCESSING..." : isEditMode ? "UPDATE POST" : "PUBLISH POST"}
              </button>
            </div>
          </form>
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
                    <span className="border border-[#6096ba] px-2 py-0.5 text-[10px] font-normal tracking-wider text-[#6096ba]">
                      {category || "Uncategorized"}
                    </span>
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] font-normal tracking-wider">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="mb-6 text-2xl font-light tracking-wide text-[#080f18] md:text-3xl">{title || "Untitled Post"}</h1>

                  {/* Meta */}
                  <div className="mb-8 flex items-center gap-4 text-[11px] text-[#8b8c89]">
                    <span>Admin</span>
                    <span className="h-1 w-1 rounded-full bg-[#8b8c89]"></span>
                    <span>Realtime Preview</span>
                    <span className="h-1 w-1 rounded-full bg-[#8b8c89]"></span>
                    <span>{`${Math.max(1, Math.ceil(content.split(" ").length / 200))} min`}</span>
                  </div>

                  {/* Featured Image */}
                  {imageUrl && (
                    <div className="relative mb-10 h-[300px] w-full overflow-hidden md:h-[400px]">
                      <img
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div className="space-y-4 text-base text-[#080f18]">
                  {content ? (
                    <RealtimePreview content={content} />
                  ) : (
                    <p className="text-[#8b8c89] italic">Start writing to see the preview...</p>
                  )}
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="mt-12">
                    <h3 className="mb-4 text-sm font-bold tracking-widest text-[#080f18]">ATTACHMENTS</h3>
                    <div className="space-y-3">
                      {attachments.map((file, index) => (
                        <div
                          key={file.filePath || index}
                          className="flex items-center justify-between rounded border border-[#e5e5e5] bg-white p-4"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Attachment</DialogTitle>
            <DialogDescription>Are you sure you want to remove this file?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setFileToDelete(null)} className="px-4 py-2 text-xs">Cancel</button>
            <button onClick={executeFileDelete} className="bg-red-600 text-white px-4 py-2 text-xs rounded">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
