"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Paperclip, Trash2, UploadCloud } from "lucide-react"

const categories = ["Mathematics", "Development", "DevOps", "Computer Science", "Research"]

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
  const [imageUrl, setImageUrl] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createClient()
  const isEditMode = postId !== null

  useEffect(() => {
    const fetchPost = async () => {
      if (postId) {
        const { data, error } = await supabase.from("posts").select("*").eq("id", postId).single()
        if (error) {
          setMessage({ type: "error", text: `Error: ${error.message}` })
        } else if (data) {
          setTitle(data.title)
          setCategory(data.category)
          setExcerpt(data.excerpt)
          setContent(data.content)
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
    const previewData = { title, category, excerpt, content, imageUrl, attachments, postId }
    localStorage.setItem("previewData", JSON.stringify(previewData))
    window.location.href = "/edit/preview"
  }

  const handleDelete = async () => {
    if (!postId) return

    setIsSubmitting(true)
    setMessage(null)

    if (attachments.length > 0) {
      const filePaths = attachments.map(file => file.filePath);
      const { error: storageError } = await supabase.storage.from('files').remove(filePaths);
      if (storageError) {
        setMessage({ type: "error", text: `Failed to delete attachments: ${storageError.message}` });
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId)

    if (error) {
      setMessage({ type: "error", text: `Error: ${error.message}` })
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
    setMessage(null)

    const { error } = await supabase.storage.from("files").upload(filePath, file)

    if (error) {
      setMessage({ type: "error", text: `Upload error: ${error.message}` })
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
      setMessage({ type: "error", text: `Failed to delete file: ${error.message}` })
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
    setMessage(null)

    const postData = {
      title,
      category,
      excerpt,
      content,
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
      setMessage({ type: "error", text: `Error: ${error.message}` })
    } else {
      setMessage({
        type: "success",
        text: `Post ${isEditMode ? "updated" : "published"} successfully!`,
      })
      if (!isEditMode) {
        setTitle("")
        setCategory("")
        setExcerpt("")
        setContent("")
        setImageUrl("")
        setAttachments([])
      }
    }

    setIsSubmitting(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-6">
      <a
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </a>

      <h1 className="mb-8 text-2xl font-light tracking-wide text-[#080f18]">{isEditMode ? "EDIT POST" : "CREATE NEW POST"}</h1>

      {message && (
        <div
          className={`mb-6 p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">TITLE</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter post title..." required className="w-full border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]" />
        </div>
        <div>
          <label htmlFor="category" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">CATEGORY</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full appearance-none border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] outline-none transition-colors focus:border-[#6096ba]">
            <option value="">Select a category...</option>
            {categories.map((cat) => ( <option key={cat} value={cat}>{cat}</option> ))}
          </select>
        </div>
        <div>
          <label htmlFor="excerpt" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">EXCERPT</label>
          <textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Write a short summary..." required rows={2} className="w-full resize-none border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]" />
        </div>
        <div>
          <label htmlFor="content" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">CONTENT</label>
          <textarea id="content" value={content} onChange={handleContentChange} placeholder="Write your post content here... (Markdown & LaTeX supported)" required rows={24} className="w-full resize-none border border-[#e5e5e5] bg-white px-4 py-3 text-sm leading-relaxed font-mono text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]" />
        </div>
        <div>
          <label htmlFor="imageUrl" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">FEATURED IMAGE URL (optional)</label>
          <input type="text" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]" />
        </div>

        <div>
          <label className="mb-2 block text-xs tracking-wider text-[#8b8c89]">ATTACHMENTS</label>
          <div className="space-y-4">
            {attachments.length > 0 && attachments.map((file) => (
              <div key={file.filePath} className="flex items-center justify-between rounded border border-[#e5e5e5] bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <Paperclip className="h-4 w-4 text-[#8b8c89]" />
                  <span className="text-sm text-[#080f18]">{file.filename}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleFileDelete(file.filePath)}
                  className="text-[#8b8c89] transition-colors hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>Delete Attachment</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove this file? This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <button
                    onClick={() => setFileToDelete(null)}
                    className="border border-[#e5e5e5] px-4 py-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeFileDelete}
                    className="bg-red-600 px-4 py-2 text-xs tracking-wider text-white transition-colors hover:bg-red-700"
                  >
                    Delete
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {attachments.length === 0 && !isUploading &&(
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-[#080f18]">No files attached</h3>
                <p className="mt-1 text-sm text-[#8b8c89]">Get started by uploading a file.</p>
              </div>
            )}
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#e5e5e5] bg-white px-4 py-3 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#6096ba] hover:text-[#6096ba]">
              <Paperclip className="h-4 w-4" />
              {isUploading ? "Uploading..." : "ADD FILE"}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-4 pt-4">
          {isEditMode && (
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" className="mr-auto text-xs tracking-wider text-red-600 transition-colors hover:text-red-800 hover:underline">DELETE POST</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Post</DialogTitle>
                  <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <button className="border border-[#e5e5e5] px-4 py-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]">Cancel</button>
                  </DialogClose>
                  <button onClick={handleDelete} disabled={isSubmitting} className="bg-red-600 px-4 py-2 text-xs tracking-wider text-white transition-colors hover:bg-red-700 disabled:opacity-50">{isSubmitting ? "Deleting..." : "Delete"}</button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <a href="/" className="border border-[#e5e5e5] px-6 py-3 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]">Cancel</a>
          <button type="button" onClick={handlePreview} className="border border-[#e5e5e5] px-6 py-3 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]">Preview</button>
          <button type="submit" disabled={isSubmitting || isUploading} className="bg-[#080f18] px-8 py-3 text-xs tracking-wider text-white transition-colors hover:bg-[#1a2632] disabled:opacity-50">{isSubmitting ? isEditMode ? "Updating..." : "Publishing..." : isEditMode ? "Update Post" : "Publish"}</button>
        </div>
      </form>
    </div>
  )
}
