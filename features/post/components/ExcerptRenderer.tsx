import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ExcerptRendererProps {
  content: string
  variant?: "card" | "view"
  className?: string
}

function normalizeCardExcerpt(content: string): string {
  return content
    .replace(/\r\n?/g, "\n")
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
    .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
    .replace(/\$([^$\n]+?)\$/g, "$1")
    .replace(/\n{2,}/g, "\n")
    .trim()
}

const cardComponents = {
  p: ({ children }: any) => <>{children} </>,
  h1: ({ children }: any) => <>{children} </>,
  h2: ({ children }: any) => <>{children} </>,
  h3: ({ children }: any) => <>{children} </>,
  h4: ({ children }: any) => <>{children} </>,
  h5: ({ children }: any) => <>{children} </>,
  h6: ({ children }: any) => <>{children} </>,
  ul: ({ children }: any) => <>{children}</>,
  ol: ({ children }: any) => <>{children}</>,
  li: ({ children }: any) => <>{children} </>,
  blockquote: ({ children }: any) => <>{children} </>,
  strong: ({ children }: any) => <span className="font-normal text-inherit">{children}</span>,
  em: ({ children }: any) => <span className="not-italic text-inherit">{children}</span>,
  pre: ({ children }: any) => <>{children}</>,
  code: ({ children }: any) => (
    <code className="rounded bg-[#f3f4f6] px-1 py-0 text-[0.85em] font-normal text-[#7d7f84]">{children}</code>
  ),
  a: ({ children }: any) => (
    <span className="underline decoration-[#c9cbd1] underline-offset-2 text-inherit">{children}</span>
  ),
  hr: () => <> </>,
  br: () => <> </>,
  table: ({ children }: any) => <>{children} </>,
  thead: ({ children }: any) => <>{children}</>,
  tbody: ({ children }: any) => <>{children}</>,
  tr: ({ children }: any) => <>{children} </>,
  th: ({ children }: any) => <>{children} </>,
  td: ({ children }: any) => <>{children} </>,
}

const viewComponents = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  h1: ({ children }: any) => <p className="mb-2 font-medium text-[#5d6269]">{children}</p>,
  h2: ({ children }: any) => <p className="mb-2 font-medium text-[#5d6269]">{children}</p>,
  h3: ({ children }: any) => <p className="mb-2 font-medium text-[#5d6269]">{children}</p>,
  h4: ({ children }: any) => <p className="mb-2 font-medium text-[#5d6269]">{children}</p>,
  h5: ({ children }: any) => <p className="mb-2 font-medium text-[#5d6269]">{children}</p>,
  h6: ({ children }: any) => <p className="mb-2 font-medium text-[#5d6269]">{children}</p>,
  ul: ({ children }: any) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
  li: ({ children }: any) => <li className="mb-1">{children}</li>,
  blockquote: ({ children }: any) => (
    <blockquote className="mb-2 border-l-2 border-[#d9dde3] pl-3 text-[#6f747b]">{children}</blockquote>
  ),
  strong: ({ children }: any) => <strong className="font-semibold text-[#4a4f56]">{children}</strong>,
  code: ({ children }: any) => (
    <code className="rounded bg-[#f3f4f6] px-1 py-0 text-[0.9em] text-[#5a5f67]">{children}</code>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#6b8aa5] underline underline-offset-2 hover:text-[#4d6d89]"
    >
      {children}
    </a>
  ),
}

export default function ExcerptRenderer({ content, variant = "card", className = "" }: ExcerptRendererProps) {
  const trimmed = content.trim()
  if (!trimmed) return null

  const markdown = variant === "card" ? normalizeCardExcerpt(trimmed) : trimmed
  const defaultClassName =
    variant === "card"
      ? "text-sm leading-relaxed text-[#8b8c89]"
      : "text-sm leading-relaxed text-[#8b8c89]"

  return (
    <div className={`${defaultClassName} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={variant === "card" ? (cardComponents as any) : (viewComponents as any)}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
