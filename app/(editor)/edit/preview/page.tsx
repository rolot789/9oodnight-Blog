"use client"

import { useState, useEffect } from "react"
import { getMDXSource } from "@/app/actions"
import MDXPreviewRenderer from "@/components/mdx-preview-renderer"
import TableOfContents from "@/features/post/components/TableOfContents"
import { Download, Paperclip } from "lucide-react"
import RealtimePreview from "@/features/editor/components/RealtimePreview"
import { Badge } from "@/components/ui/badge"
import SiteFooter from "@/components/layout/SiteFooter"
import AuthorCard from "@/components/layout/AuthorCard"

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
            {previewData.imageUrl && previewData.imageUrl !== "/Thumbnail.jpg" && (
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

          <AuthorCard />
        </div>
      </article>

      <SiteFooter />
    </div>
  )
}
