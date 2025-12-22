"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import okaidia from "react-syntax-highlighter/dist/esm/styles/prism/okaidia"
import "katex/dist/katex.min.css"

interface PreviewProps {
  content: string
}

export default function Preview({ content }: PreviewProps) {
  return (
    <div className="prose lg:prose-xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
