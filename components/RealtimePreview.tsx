"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import okaidia from "react-syntax-highlighter/dist/esm/styles/prism/okaidia"
import "katex/dist/katex.min.css"
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
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "")
            return !inline && match ? (
              <SyntaxHighlighter
                style={okaidia}
                language={match[1]}
                PreTag="div"
                showLineNumbers
                customStyle={{ margin: 0, fontSize: "0.875rem", borderRadius: "0.25rem" }}
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className="rounded bg-[#f0f0f0] px-1 py-0.5 font-mono text-sm text-[#c41d7f]" {...props}>
                {children}
              </code>
            )
          }
        } as any}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
