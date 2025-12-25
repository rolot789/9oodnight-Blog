"use client"

import { useState, useEffect } from "react"
import { getMDXSource } from "@/app/actions"
import MDXPreviewRenderer from "@/components/mdx-preview-renderer"
import TableOfContents from "@/components/TableOfContents"
import { Download, Paperclip } from "lucide-react"
import RealtimePreview from "@/components/RealtimePreview"
import { Badge } from "@/components/ui/badge"

interface PreviewData {
  title: string
  category: string
  excerpt: string
  content: string
  imageUrl: string
  attachments: { filename: string; url: string; filePath: string }[]
  tags?: string[]
  postId?: string
}

export default function PreviewPage() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [mdxSource, setMdxSource] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPreview() {
      const data = localStorage.getItem("previewData")
      if (data) {
        const parsed = JSON.parse(data)
        setPreviewData(parsed)

        if (parsed.content) {
          const { data: source } = await getMDXSource(parsed.content)
          setMdxSource(source)
        }
      }
      setIsLoading(false)
    }
    loadPreview()
  }, [])
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
        <p className="text-sm text-[#8b8c89]">Loading...</p>
      </div>
    )
  }

  if (!previewData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-light tracking-wide text-[#080f18]">Preview Not Available</h1>
          <a href="/edit" className="text-sm text-[#6096ba] hover:text-[#4a7a9a]">
            Return to Edit
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Post Content */}
      <article className="w-full py-12">
        <div className="mx-auto max-w-3xl px-6 relative">
          
          {/* Header Section (Centered) */}
          <div>
            {/* Back Link */}
            <a
              href={previewData.postId ? `/edit?id=${previewData.postId}` : "/edit"}
              className="mb-8 inline-flex items-center gap-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Edit
            </a>

            {/* Category and Tags */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="border border-[#6096ba] px-2 py-0.5 text-[10px] font-normal tracking-wider text-[#6096ba]">
                {previewData.category}
              </span>
              {previewData.tags && previewData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] font-normal tracking-wider">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="mb-6 text-2xl font-light tracking-wide text-[#080f18] md:text-3xl">{previewData.title}</h1>

            {/* Meta */}
            <div className="mb-8 flex items-center gap-4 text-[11px] text-[#8b8c89]">
              <span>Admin</span>
              <span className="h-1 w-1 rounded-full bg-[#8b8c89]"></span>
              <span>Preview</span>
            </div>

            {/* Featured Image */}
            {previewData.imageUrl && (
              <div className="relative mb-10 h-[300px] w-full overflow-hidden md:h-[400px]">
                <img
                  src={previewData.imageUrl}
                  alt={previewData.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Excerpt */}
            {previewData.excerpt && (
              <div className="mb-8 text-sm text-[#8b8c89]">
                {previewData.excerpt}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-4 text-base text-[#080f18]">
            {previewData.content ? (
              <RealtimePreview content={previewData.content} />
            ) : (
              <p>No content to preview.</p>
            )}
          </div>

          {/* Attachments */}
          {previewData.attachments && previewData.attachments.length > 0 && (
            <div className="mt-12">
              <h3 className="mb-4 text-sm font-bold tracking-widest text-[#080f18]">ATTACHMENTS</h3>
              <div className="space-y-3">
                {previewData.attachments.map((file, index) => (
                  <a
                    key={file.filePath || index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded border border-[#e5e5e5] bg-white p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-4 w-4 text-[#8b8c89]" />
                      <span className="text-sm text-[#080f18]">{file.filename}</span>
                    </div>
                    <Download className="h-4 w-4 text-[#8b8c89]" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ToC Sidebar (Absolute) */}
          <aside className="hidden xl:block absolute left-full top-0 ml-12 h-full">
            <TableOfContents />
          </aside>

          {/* Footer Section (Centered) */}
          <div>
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
