"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Post } from "@/lib/types"

const categories = ["Mathematics", "Development", "DevOps", "Computer Science", "Research"]

export default function EditPage() {
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
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <header className="w-full border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="text-sm font-light tracking-[0.3em] text-[#080f18]">
            MY PORTFOLIO
          </a>
          <nav className="flex items-center gap-8">
            <a href="/" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
              HOME
            </a>
            <a href="/dev" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
              DEV
            </a>
            <a href="/math" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
              MATH
            </a>
            <a href="/about" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
              ABOUT
            </a>
          </nav>
        </div>
      </header>

      {/* Editor */}
      <main className="w-full py-12">
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
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#080f18] py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm font-light tracking-[0.3em] text-white">MY PORTFOLIO</p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com"
                className="text-[#8b8c89] transition-colors hover:text-white"
                aria-label="GitHub"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                className="text-[#8b8c89] transition-colors hover:text-white"
                aria-label="LinkedIn"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="mailto:hello@example.com"
                className="text-[#8b8c89] transition-colors hover:text-white"
                aria-label="Email"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </a>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-[#8b8c89]">© 2025 My Portfolio. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}