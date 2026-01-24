"use client"

import dynamic from "next/dynamic"

const BlockNoteViewer = dynamic(() => import("@/components/BlockNoteViewer"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#8b8c89]">
        <div className="w-5 h-5 border-2 border-[#6096ba] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Loading content...</span>
      </div>
    </div>
  ),
})

interface BlockNoteViewerClientProps {
  content: string
}

export default function BlockNoteViewerClient({ content }: BlockNoteViewerClientProps) {
  return <BlockNoteViewer content={content} />
}
