"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Post } from "@/lib/types"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import okaidia from "react-syntax-highlighter/dist/esm/styles/prism/okaidia"
import "katex/dist/katex.min.css"

export default function PostPage() {
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPost() {
      const params = new URLSearchParams(window.location.search)
      const id = params.get("id")

      if (!id) {
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).single()

      if (!error && data) {
        setPost(data as Post)
      }
      setIsLoading(false)
    }

    fetchPost()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
        <p className="text-sm text-[#8b8c89]">Loading...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-light tracking-wide text-[#080f18]">Post Not Found</h1>
          <a href="/" className="text-sm text-[#6096ba] hover:text-[#4a7a9a]">
            Return Home
          </a>
        </div>
      </div>
    )
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

      {/* Post Content */}
      <article className="w-full py-12">
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

          {/* Category */}
          <div className="mb-4">
            <span className="border border-[#6096ba] px-2 py-0.5 text-[10px] font-normal tracking-wider text-[#6096ba]">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-2xl font-light tracking-wide text-[#080f18] md:text-3xl">{post.title}</h1>

          {/* Meta */}
          <div className="mb-8 flex items-center gap-4 text-[11px] text-[#8b8c89]">
            <span>Admin</span>
            <span className="h-1 w-1 rounded-full bg-[#8b8c89]"></span>
            <span>
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="h-1 w-1 rounded-full bg-[#8b8c89]"></span>
            <span>{post.read_time} read</span>
          </div>

          {/* Featured Image */}
          <div className="relative mb-10 h-[300px] w-full overflow-hidden md:h-[400px]">
            <img
              src={post.image_url || "/placeholder.svg?height=400&width=800&query=abstract"}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="space-y-4 text-base text-[#080f18]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({ node, ...props }) => <h1 className="mb-4 mt-8 text-3xl font-bold tracking-tight" {...props} />,
                h2: ({ node, ...props }) => <h2 className="mb-3 mt-6 text-2xl font-bold tracking-tight" {...props} />,
                h3: ({ node, ...props }) => <h3 className="mb-3 mt-5 text-xl font-bold tracking-tight" {...props} />,
                h4: ({ node, ...props }) => <h4 className="mb-2 mt-4 text-lg font-bold tracking-tight" {...props} />,
                p: ({ node, ...props }) => <p className="mb-4 leading-7" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                em: ({ node, ...props }) => <em className="italic" {...props} />,
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={okaidia}
                      language={match[1]}
                      PreTag="div"
                      showLineNumbers
                      customStyle={{ margin: 0, fontSize: "0.875rem" }}
                      className="mb-4 rounded"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className={
                        inline
                          ? "rounded bg-[#f0f0f0] px-2 py-1 font-mono text-sm text-[#c41d7f]"
                          : className
                      }
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[#6096ba] bg-[#f5f5f5] py-2 pl-4 italic text-[#555]" {...props} />,
                ul: ({ node, ...props }) => <ul className="mb-4 list-inside list-disc space-y-2 pl-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="mb-4 list-inside list-decimal space-y-2 pl-4" {...props} />,
                li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                a: ({ node, ...props }) => <a className="text-[#6096ba] underline hover:text-[#4a7a9a]" {...props} />,
                table: ({ node, ...props }) => <table className="mb-4 w-full border-collapse border border-[#e5e5e5]" {...props} />,
                tr: ({ node, ...props }) => <tr className="border border-[#e5e5e5]" {...props} />,
                td: ({ node, ...props }) => <td className="border border-[#e5e5e5] px-4 py-2" {...props} />,
                th: ({ node, ...props }) => <th className="border border-[#e5e5e5] bg-[#f0f0f0] px-4 py-2 font-bold" {...props} />,
              }}
            >
              {post.content}
            </ReactMarkdown>
          <div>
            {post.content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="mb-6 text-base leading-relaxed text-[#4a4a4a]">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Divider */}
          <div className="my-12 border-t border-[#e5e5e5]"></div>

          {/* Author Section */}
          <div className="flex items-center gap-4 rounded bg-white p-6 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#080f18] text-lg font-light text-white">
              A
            </div>
            <div>
              <p className="text-sm font-medium tracking-wide text-[#080f18]">Admin</p>
              <p className="text-xs text-[#8b8c89]">Developer & Mathematician</p>
            </div>
          </div>
        </div>
      </article>

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
