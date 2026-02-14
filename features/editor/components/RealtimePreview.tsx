"use client"

import dynamic from "next/dynamic"
import MarkdownRenderer from "@/features/post/components/MarkdownRenderer"

const BlockNoteViewer = dynamic(() => import("@/components/BlockNoteViewer"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[100px] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#8b8c89]">
        <div className="w-4 h-4 border-2 border-[#6096ba] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  ),
})

interface RealtimePreviewProps {
  content: string
}

function isHtmlContent(content: string): boolean {
  const trimmed = content.trim()
  return trimmed.startsWith("<") && (
    trimmed.startsWith("<p") ||
    trimmed.startsWith("<h") ||
    trimmed.startsWith("<div") ||
    trimmed.startsWith("<ul") ||
    trimmed.startsWith("<ol") ||
    trimmed.startsWith("<blockquote") ||
    trimmed.startsWith("<pre") ||
    trimmed.startsWith("<table")
  )
}

export default function RealtimePreview({ content }: RealtimePreviewProps) {
  if (!isHtmlContent(content)) {
    return <MarkdownRenderer content={content} />
  }

  return <BlockNoteViewer content={content} />
}
