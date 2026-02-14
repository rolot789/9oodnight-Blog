"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeSlug from "rehype-slug"
import "katex/dist/katex.min.css"
import CodeBlock from "@/components/CodeBlock"
import { mdxComponents } from "@/components/mdx-components"
import { sanitizeHtmlContent } from "@/lib/shared/security"
import { normalizeKaTeXMarkdown } from "@/lib/shared/katex-markdown"

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Check if content is HTML (from BlockNote)
function isHTML(content: string): boolean {
  const trimmed = content.trim()
  return trimmed.startsWith('<') && (
    trimmed.startsWith('<p') || 
    trimmed.startsWith('<h') || 
    trimmed.startsWith('<div') || 
    trimmed.startsWith('<ul') || 
    trimmed.startsWith('<ol') ||
    trimmed.startsWith('<blockquote') ||
    trimmed.startsWith('<pre') ||
    trimmed.startsWith('<table')
  )
}

// Normalize markdown content for consistent rendering
function normalizeMarkdown(content: string): string {
  let normalized = normalizeKaTeXMarkdown(content)

  // Normalize line breaks for paragraphs
  normalized = normalized.replace(/\n\n+/g, '\n\n')
  
  // Handle checkbox list items from BlockNote
  normalized = normalized.replace(/^\[\s?\]\s/gm, '- [ ] ')
  normalized = normalized.replace(/^\[x\]\s/gm, '- [x] ')

  return normalized
}

// Style overrides for BlockNote HTML content
const htmlStyles = `
  .blocknote-html-content p { margin-bottom: 1rem; line-height: 1.7; }
  .blocknote-html-content h1 { font-size: 2rem; font-weight: 700; margin: 2rem 0 1rem; }
  .blocknote-html-content h2 { font-size: 1.5rem; font-weight: 600; margin: 1.75rem 0 0.75rem; }
  .blocknote-html-content h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
  .blocknote-html-content ul, .blocknote-html-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
  .blocknote-html-content li { margin: 0.25rem 0; }
  .blocknote-html-content blockquote { border-left: 4px solid #6096ba; padding-left: 1rem; margin: 1rem 0; color: #6b7280; font-style: italic; }
  .blocknote-html-content pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
  .blocknote-html-content code { background: #f0f0f0; padding: 0.125rem 0.375rem; font-family: monospace; font-size: 0.875rem; }
  .blocknote-html-content pre code { background: transparent; padding: 0; }
  .blocknote-html-content a { color: #6096ba; text-decoration: underline; }
  .blocknote-html-content img { max-width: 100%; height: auto; margin: 1rem 0; }
  .blocknote-html-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  .blocknote-html-content th, .blocknote-html-content td { border: 1px solid #e5e5e5; padding: 0.5rem 1rem; text-align: left; }
  .blocknote-html-content th { background: #f9fafb; font-weight: 600; }
  .blocknote-html-content [data-text-color] { color: var(--text-color); }
  .blocknote-html-content [data-background-color] { background-color: var(--bg-color); padding: 0.125rem 0.25rem; }
`

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  // If content is HTML (from BlockNote), render it directly
  if (isHTML(content)) {
    const sanitizedContent = sanitizeHtmlContent(content)
    return (
      <>
        <style>{htmlStyles}</style>
        <div 
          className={`blocknote-html-content prose prose-sm max-w-none text-[#080f18] ${className}`}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </>
    )
  }

  // Otherwise, render as Markdown (backwards compatibility)
  const normalizedContent = normalizeMarkdown(content)

  return (
    <div className={`prose prose-sm max-w-none text-[#080f18] ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeKatex]}
        components={{
          ...mdxComponents,
          code: CodeBlock,
          // Handle checkbox list items
          input: ({ type, checked, ...props }: any) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 h-4 w-4 accent-[#6096ba]"
                  {...props}
                />
              )
            }
            return <input type={type} {...props} />
          },
        } as any}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}
