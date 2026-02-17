import BlockNoteViewerClient from "@/components/BlockNoteViewerClient"
import { sanitizeHtmlContent } from "@/lib/shared/security"
import { createHighlighter } from "shiki"
import PostHtmlClient from "./PostHtmlClient"

interface PostContentProps {
  content: string
}

const CODE_THEME = "github-light-default"
const CODE_BLOCK_PATTERN = /<pre([^>]*)>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [CODE_THEME],
      langs: [],
    })
  }
  return highlighterPromise
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2f;/gi, "/")
}

function normalizeLanguage(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_+-]/g, "")
}

function extractCodeLanguage(attrs: string): string {
  const dataLanguageMatch = attrs.match(/data-language\s*=\s*['"]([^'"]+)['"]/i)
  if (dataLanguageMatch?.[1]) {
    return normalizeLanguage(dataLanguageMatch[1])
  }

  const classLanguageMatch = attrs.match(/class\s*=\s*['"][^'"]*language-([a-z0-9_+-]+)/i)
  if (classLanguageMatch?.[1]) {
    return normalizeLanguage(classLanguageMatch[1])
  }

  return "text"
}

async function renderHighlightedCode(code: string, requestedLanguage: string): Promise<string> {
  const highlighter = await getHighlighter()
  let language = requestedLanguage || "text"

  try {
    if (language !== "text" && !highlighter.getLoadedLanguages().includes(language as any)) {
      await highlighter.loadLanguage(language as any)
    }
  } catch {
    language = "text"
  }

  try {
    return highlighter.codeToHtml(code, {
      lang: language as any,
      theme: CODE_THEME,
    })
  } catch {
    return highlighter.codeToHtml(code, {
      lang: "text",
      theme: CODE_THEME,
    })
  }
}

async function applyCodeHighlighting(html: string): Promise<string> {
  const matches = Array.from(html.matchAll(CODE_BLOCK_PATTERN))
  if (matches.length === 0) {
    return html
  }

  let highlightedHtml = ""
  let lastIndex = 0

  for (const match of matches) {
    const [fullMatch, preAttrs = "", codeAttrs = "", codeInner = ""] = match
    const start = match.index ?? 0

    highlightedHtml += html.slice(lastIndex, start)

    const language = extractCodeLanguage(`${preAttrs} ${codeAttrs}`)
    const plainCode = decodeHtmlEntities(
      codeInner
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/?[^>]+>/g, "")
    )

    highlightedHtml += await renderHighlightedCode(plainCode, language)
    lastIndex = start + fullMatch.length
  }

  highlightedHtml += html.slice(lastIndex)
  return highlightedHtml
}

const postHtmlStyles = `
  .post-content p { margin-bottom: 1rem; line-height: 1.7; }
  .post-content h1 { font-size: 2rem; font-weight: 700; margin: 14px 0 8px !important; line-height: 1.3; scroll-margin-top: 84px; }
  .post-content h2 { font-size: 1.5rem; font-weight: 600; margin: 12px 0 8px !important; line-height: 1.35; scroll-margin-top: 84px; }
  .post-content h3 { font-size: 1.25rem; font-weight: 600; margin: 8px 0 8px !important; line-height: 1.4; scroll-margin-top: 84px; }
  .post-content ul, .post-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
  .post-content li { margin: 0.25rem 0; }
  .post-content blockquote { border-left: 4px solid #6096ba; padding-left: 1rem; margin: 1rem 0; color: #6b7280; font-style: italic; }
  .post-content :not(pre) > code { background: #eef2f7; padding: 0.125rem 0.375rem; border-radius: 4px; font-family: monospace; font-size: 0.875rem; }
  .post-content [data-inline-content-type="inlineMath"],
  .post-content .math-inline {
    display: inline-flex;
    align-items: center;
    min-height: 1.2em;
    margin: 0 0.03rem;
    padding: 0 0.06rem;
    border-radius: 4px;
    border: 1px solid transparent;
    background: transparent;
    vertical-align: baseline;
  }
  .post-content [data-inline-content-type="inlineMath"] .katex,
  .post-content .math-inline .katex {
    font-size: 1em;
    color: #37352f;
    line-height: 1.25;
  }
  .post-content [data-content-type="mathBlock"] {
    margin: 0.95rem 0;
    text-align: center;
  }
  .post-content [data-content-type="mathBlock"] .math-block,
  .post-content [data-content-type="mathBlock"] .bn-editor-math-block {
    border: 0;
    border-radius: 0;
    background: transparent;
    padding: 0.15rem 0;
    text-align: center;
  }
  .post-content [data-content-type="mathBlock"] .bn-editor-math-block-affordance {
    display: none !important;
  }
  .post-content [data-content-type="mathBlock"] .katex-display {
    margin: 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .post-content .math-empty {
    color: #9b9a97;
    font-size: 0.9em;
    font-style: italic;
  }
  .post-content .math-fallback {
    color: #b42318;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 0.9em;
    white-space: pre-wrap;
  }
  .post-content .code-block-shell { position: relative; margin: 1rem 0; }
  .post-content pre,
  .post-content .code-block-shell pre {
    margin: 0;
    padding: 0.9rem 0;
    overflow-x: auto;
    border-radius: 10px;
    border: 1px solid #cfdae8;
    background: #edf3fa !important;
    color: #1f2937 !important;
  }
  .post-content pre code,
  .post-content .code-block-shell pre code {
    display: block;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 0.86rem;
    line-height: 1.15;
    counter-reset: code-line;
  }
  .post-content pre code .line,
  .post-content .code-block-shell pre code .line {
    position: relative;
    display: block;
    min-height: 1.15em;
    padding: 0 1rem 0 3.25rem;
  }
  .post-content pre code .line::before,
  .post-content .code-block-shell pre code .line::before {
    counter-increment: code-line;
    content: counter(code-line);
    position: absolute;
    left: 0;
    width: 2.5rem;
    padding-right: 0.75rem;
    text-align: right;
    color: #6f7d92;
    border-right: 1px solid #d3deeb;
    user-select: none;
  }
  .post-content .code-copy-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 3;
    width: 32px;
    height: 32px;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    color: #5c6b80;
    cursor: pointer;
    display: inline-flex !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
    transition: all 0.15s ease;
  }
  .post-content .code-copy-button:hover {
    border-color: #c6d4e3;
    background: #ffffff;
    color: #334155;
  }
  .post-content .code-copy-button svg {
    width: 15px;
    height: 15px;
  }
  .post-content .code-copy-button .icon-copied { display: none; }
  .post-content .code-copy-button.is-copied {
    border-color: #b8deca;
    background: #edf9f1;
    color: #18794e;
  }
  .post-content .code-copy-button.is-copied .icon-copy { display: none; }
  .post-content .code-copy-button.is-copied .icon-copied { display: inline-flex; }
  .post-content .code-copy-button.is-error {
    border-color: #f2c8ce;
    background: #fff4f5;
    color: #b42318;
  }
  .post-content a { color: #6096ba; text-decoration: underline; text-underline-offset: 2px; }
  .post-content img { max-width: 100%; height: auto; margin: 1rem 0; }
  .post-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  .post-content th, .post-content td { border: 1px solid #e5e5e5; padding: 0.5rem 1rem; text-align: left; }
  .post-content th { background: #f9fafb; font-weight: 600; }
`

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

function isBlockNoteJson(content: string): boolean {
  const trimmed = content.trim()
  if (!trimmed.startsWith("[")) return false
  try {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object" && "type" in parsed[0]
  } catch {
    return false
  }
}

function isBlockNoteHtml(content: string): boolean {
  const trimmed = content.trim()
  return (
    trimmed.includes("data-content-type=") ||
    trimmed.includes('class="bn-') ||
    trimmed.includes("class='bn-")
  )
}

function createHeadingSlug(text: string, index: number): string {
  const slug = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  if (!slug) {
    return `section-${index + 1}`
  }

  return slug
}

function addHeadingIds(html: string): string {
  const slugCounter = new Map<string, number>()
  let headingIndex = 0

  return html.replace(
    /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (fullMatch, level, attrs, innerHtml) => {
      if (/\sid\s*=\s*(['"]).+?\1/i.test(attrs)) {
        return fullMatch
      }

      const plainText = innerHtml
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z0-9#]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
      const baseSlug = createHeadingSlug(plainText, headingIndex)
      headingIndex += 1

      const nextCount = (slugCounter.get(baseSlug) ?? 0) + 1
      slugCounter.set(baseSlug, nextCount)

      const slug = nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`
      return `<h${level}${attrs} id="${slug}">${innerHtml}</h${level}>`
    }
  )
}

export default async function PostContent({ content }: PostContentProps) {
  if (!content) {
    return null
  }

  if (isBlockNoteJson(content)) {
    return <BlockNoteViewerClient content={content} />
  }

  if (!isHtmlContent(content)) {
    return <BlockNoteViewerClient content={content} />
  }

  const safeHtml = sanitizeHtmlContent(content)

  if (isBlockNoteHtml(safeHtml)) {
    return <BlockNoteViewerClient content={safeHtml} />
  }

  const htmlWithHeadingIds = addHeadingIds(safeHtml)
  const highlightedHtml = await applyCodeHighlighting(htmlWithHeadingIds)

  return (
    <>
      <style>{postHtmlStyles}</style>
      <PostHtmlClient html={highlightedHtml} />
    </>
  )
}
