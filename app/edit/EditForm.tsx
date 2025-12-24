"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const categories = ["Mathematics", "Development", "DevOps", "Computer Science", "Research"]

export default function EditForm() {
  const searchParams = useSearchParams()
  const postId = searchParams.get("id")

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
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
        }
      }
    }
    if (isEditMode) {
      fetchPost()
    }
  }, [postId, isEditMode, supabase])

  const handlePreview = () => {
    const previewData = { title, category, excerpt, content, imageUrl, postId }
    localStorage.setItem("previewData", JSON.stringify(previewData))
    window.location.href = "/edit/preview"
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    
    // Auto-detect ''' on a new line and convert to code block
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

  const insertMarkdown = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = document.getElementById("content") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newContent =
      content.substring(0, start) +
      before +
      (selectedText || placeholder) +
      after +
      content.substring(end)

    setContent(newContent)

    // 커서 위치 조정
    setTimeout(() => {
      const cursorPos = start + before.length + (selectedText ? selectedText.length : placeholder.length)
      textarea.selectionStart = textarea.selectionEnd = cursorPos
      textarea.focus()
    }, 0)
  }

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + B: Bold
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault()
      insertMarkdown("**", "**", "bold text")
    }
    // Ctrl/Cmd + I: Italic
    else if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault()
      insertMarkdown("*", "*", "italic text")
    }
    // Ctrl/Cmd + Shift + C: Code Block
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
      e.preventDefault()
      insertMarkdown("```\n", "\n```", "code")
    }
    // Ctrl/Cmd + H: Heading 1
    else if ((e.ctrlKey || e.metaKey) && e.key === "h") {
      e.preventDefault()
      insertMarkdown("# ", "", "Heading 1")
    }
    // Ctrl/Cmd + Alt + H: Heading 2
    else if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === "h") {
      e.preventDefault()
      insertMarkdown("## ", "", "Heading 2")
    }
    // Ctrl/Cmd + K: Code inline
    else if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault()
      insertMarkdown("`", "`", "code")
    }
    // Ctrl/Cmd + Shift + Q: Quote
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Q") {
      e.preventDefault()
      insertMarkdown("> ", "", "quote")
    }
    // Ctrl/Cmd + Shift + L: Link
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "L") {
      e.preventDefault()
      insertMarkdown("[", "](url)", "link text")
    }
    // Ctrl/Cmd + M: Math/LaTeX
    else if ((e.ctrlKey || e.metaKey) && e.key === "m") {
      e.preventDefault()
      insertMarkdown("$", "$", "x = y")
    }
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
      }
    }

    setIsSubmitting(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-6">
      {/* Back Link */}
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

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">
            TITLE
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            required
            className="w-full border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">
            CATEGORY
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full appearance-none border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] outline-none transition-colors focus:border-[#6096ba]"
          >
            <option value="">Select a category...</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">
            EXCERPT
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Write a short summary..."
            required
            rows={2}
            className="w-full resize-none border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]"
          />
        </div>

        {/* Content */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="content" className="block text-xs tracking-wider text-[#8b8c89]">
              CONTENT
            </label>
            <div className="text-[10px] text-[#c0c0c0]">
              Shortcuts: <kbd className="rounded bg-[#f0f0f0] px-1">Ctrl+B</kbd> Bold · <kbd className="rounded bg-[#f0f0f0] px-1">Ctrl+I</kbd> Italic · <kbd className="rounded bg-[#f0f0f0] px-1">Ctrl+Shift+C</kbd> Code · <kbd className="rounded bg-[#f0f0f0] px-1">Ctrl+H</kbd> H1
            </div>
          </div>
          <div className="mb-2 text-[10px] text-[#c0c0c0]">
            More: <kbd className="rounded bg-[#f0f0f0] px-1">Ctrl+K</kbd> Inline Code · <kbd className="rounded bg-[#f0f0f0] px-1">Ctrl+Shift+L</kbd> Link · <kbd className="rounded bg-[#f0f0f0] px-1">Ctrl+M</kbd> LaTeX · <kbd className="rounded bg-[#f0f0f0] px-1">Ctrl+Shift+Q</kbd> Quote
          </div>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleContentKeyDown}
            placeholder="Write your post content here... (Markdown & LaTeX supported)"
            required
            rows={16}
            className="w-full resize-none border border-[#e5e5e5] bg-white px-4 py-3 text-sm leading-relaxed font-mono text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]"
          />
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="imageUrl" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">
            FEATURED IMAGE URL (optional)
          </label>
          <input
            type="text"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <a
            href="/"
            className="border border-[#e5e5e5] px-6 py-3 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]"
          >
            Cancel
          </a>
          <button
            type="button"
            onClick={handlePreview}
            className="border border-[#e5e5e5] px-6 py-3 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]"
          >
            Preview
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#080f18] px-8 py-3 text-xs tracking-wider text-white transition-colors hover:bg-[#1a2632] disabled:opacity-50"
          >
            {isSubmitting
              ? isEditMode
                ? "Updating..."
                : "Publishing..."
              : isEditMode
                ? "Update Post"
                : "Publish"}
          </button>
        </div>
      </form>
    </div>
  )
}
