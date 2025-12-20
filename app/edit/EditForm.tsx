"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Post } from "@/lib/types"

const categories = ["Mathematics", "Development", "DevOps", "Computer Science", "Research"]

export default function EditForm() {
  const searchParams = useSearchParams()
  const postId = searchParams.get("id")

  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchPost = async () => {
      if (postId) {
        const { data, error } = await supabase.from("posts").select("*").eq("id", postId).single()
        if (error) {
          setMessage({ type: "error", text: `Error: ${error.message}` })
        } else if (data) {
          setPost(data)
          setTitle(data.title)
          setCategory(data.category)
          setExcerpt(data.excerpt)
          setContent(data.content)
          setImageUrl(data.image_url || "")
        }
      }
    }
    fetchPost()
  }, [postId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    if (!postId) {
      setMessage({ type: "error", text: "No post ID provided." })
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase
      .from("posts")
      .update({
        title,
        category,
        excerpt,
        content,
        image_url: imageUrl || null,
      })
      .eq("id", postId)

    if (error) {
      setMessage({ type: "error", text: `Error: ${error.message}` })
    } else {
      setMessage({ type: "success", text: "Post updated successfully!" })
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

      <h1 className="mb-8 text-2xl font-light tracking-wide text-[#080f18]">EDIT POST</h1>

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
          <label htmlFor="content" className="mb-2 block text-xs tracking-wider text-[#8b8c89]">
            CONTENT
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content here..."
            required
            rows={16}
            className="w-full resize-none border border-[#e5e5e5] bg-white px-4 py-3 text-sm leading-relaxed text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#6096ba]"
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
            type="submit"
            disabled={isSubmitting}
            className="bg-[#080f18] px-8 py-3 text-xs tracking-wider text-white transition-colors hover:bg-[#1a2632] disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Post"}
          </button>
        </div>
      </form>
    </div>
  )
}
