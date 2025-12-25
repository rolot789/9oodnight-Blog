"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import CodeBlock from "./CodeBlock"
import { mdxComponents } from "./mdx-components"

interface RealtimePreviewProps {
  content: string
}

export default function RealtimePreview({ content }: RealtimePreviewProps) {
  return (
    <div className="prose prose-sm max-w-none text-[#080f18]">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          ...mdxComponents,
          code: CodeBlock
        } as any}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
