"use client"

import { useEffect, useRef, useState } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"
import { blockNoteSchema } from "@/features/editor/lib/blocknote-schema"
import renderMathInElement from "katex/contrib/auto-render"

interface BlockNoteViewerProps {
  content: string
  className?: string
}

const KATEX_DELIMITERS = [
  { left: "$$", right: "$$", display: true },
  { left: "$", right: "$", display: false },
]

const COPY_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="9" y="9" width="13" height="13" rx="2"></rect>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>
`

const COPIED_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M20 6 9 17l-5-5"></path>
</svg>
`

function copyWithFallback(text: string): boolean {
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "-1000px"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()

  let copied = false
  try {
    copied = document.execCommand("copy")
  } catch {
    copied = false
  } finally {
    document.body.removeChild(textarea)
  }

  return copied
}

async function copyText(text: string): Promise<boolean> {
  if (!text) return false

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return copyWithFallback(text)
    }
  }

  return copyWithFallback(text)
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

// Generate slug from text for heading IDs
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function BlockNoteViewer({ content, className = "" }: BlockNoteViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const editor = useCreateBlockNote({
    schema: blockNoteSchema,
    domAttributes: {
      editor: {
        class: "blocknote-viewer",
      },
    },
  })

  // Load content into the editor
  useEffect(() => {
    const loadContent = async () => {
      if (content && editor) {
        try {
          let blocks
          if (isBlockNoteJson(content)) {
            blocks = JSON.parse(content)
          } else if (isHTML(content)) {
            blocks = await editor.tryParseHTMLToBlocks(content)
          } else {
            blocks = await editor.tryParseMarkdownToBlocks(content)
          }
          editor.replaceBlocks(editor.document, blocks)
        } catch (error) {
          console.error("Failed to parse content:", error)
        }
      }
      setIsLoaded(true)
    }
    loadContent()
  }, [content, editor])

  // Add IDs to headings after content is loaded for ToC
  useEffect(() => {
    if (!isLoaded) return
    
    const addHeadingIds = () => {
      // BlockNote renders headings in various ways - try all possible selectors
      const selectors = [
        '.blocknote-viewer-wrapper h1',
        '.blocknote-viewer-wrapper h2', 
        '.blocknote-viewer-wrapper h3',
        '.blocknote-viewer-wrapper [data-level="1"]',
        '.blocknote-viewer-wrapper [data-level="2"]',
        '.blocknote-viewer-wrapper [data-level="3"]',
        '.blocknote-viewer-wrapper [data-content-type="heading"]',
        '.blocknote-viewer [data-content-type="heading"]',
        '.bn-block-content[data-content-type="heading"]'
      ].join(', ')
      
      const headings = document.querySelectorAll(selectors)
      
      headings.forEach((heading, index) => {
        if (!heading.id && heading.textContent) {
          const slug = generateSlug(heading.textContent)
          heading.id = slug || `heading-${index}`
        }
      })
    }
    
    // Small delay to ensure BlockNote has rendered
    const timeoutId = setTimeout(addHeadingIds, 200)
    return () => clearTimeout(timeoutId)
  }, [isLoaded])

  useEffect(() => {
    if (!isLoaded) return

    const wrapper = wrapperRef.current
    if (!wrapper) return

    try {
      renderMathInElement(wrapper, {
        delimiters: KATEX_DELIMITERS,
        throwOnError: false,
        strict: "ignore",
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
      })
    } catch (error) {
      console.error("Failed to render KaTeX formulas:", error)
    }

    const codeBlocks = Array.from(wrapper.querySelectorAll<HTMLPreElement>("pre"))

    for (const pre of codeBlocks) {
      const codeShell =
        pre.closest<HTMLElement>('.bn-block-content[data-content-type="codeBlock"]') ??
        pre.parentElement
      if (!codeShell) continue

      codeShell.classList.add("bn-code-shell")
      if (codeShell.querySelector(".bn-code-copy-button")) {
        continue
      }

      const button = document.createElement("button")
      button.type = "button"
      button.className = "bn-code-copy-button"
      button.setAttribute("aria-label", "Copy code")
      button.setAttribute("title", "Copy code")
      button.innerHTML = `
        <span class="icon-copy">${COPY_ICON}</span>
        <span class="icon-copied">${COPIED_ICON}</span>
      `
      codeShell.appendChild(button)
    }

    const resetTimers = new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>()

    const resetButtonState = (button: HTMLButtonElement) => {
      button.classList.remove("is-copied", "is-error")
      button.setAttribute("aria-label", "Copy code")
      button.setAttribute("title", "Copy code")
    }

    const handleCopyClick = async (event: Event) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest<HTMLButtonElement>(".bn-code-copy-button")
      if (!button || !wrapper.contains(button)) return

      const shell = button.closest<HTMLElement>(".bn-code-shell")
      const codeText = shell?.querySelector("pre code")?.textContent ?? shell?.querySelector("pre")?.textContent ?? ""
      if (!codeText.trim()) return

      const isCopied = await copyText(codeText)
      button.classList.remove("is-copied", "is-error")
      button.classList.add(isCopied ? "is-copied" : "is-error")
      button.setAttribute("aria-label", isCopied ? "Copied" : "Copy failed")
      button.setAttribute("title", isCopied ? "Copied" : "Copy failed")

      const existingTimer = resetTimers.get(button)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const resetDelay = isCopied ? 1400 : 1800
      const timer = setTimeout(() => {
        resetButtonState(button)
        resetTimers.delete(button)
      }, resetDelay)
      resetTimers.set(button, timer)
    }

    wrapper.addEventListener("click", handleCopyClick)

    return () => {
      wrapper.removeEventListener("click", handleCopyClick)
      for (const timer of resetTimers.values()) {
        clearTimeout(timer)
      }
      resetTimers.clear()
    }
  }, [content, isLoaded])

  if (!isLoaded) {
    return (
      <div className={`min-h-[100px] flex items-center justify-center ${className}`}>
        <div className="flex items-center gap-3 text-[#8b8c89]">
          <div className="w-4 h-4 border-2 border-[#6096ba] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className={`blocknote-viewer-wrapper ${className}`}>
      <BlockNoteView
        editor={editor}
        editable={false}
        theme="light"
      />
      <style jsx global>{`
        .blocknote-viewer-wrapper {
          --bn-colors-editor-background: transparent;
          --bn-colors-editor-text: #080f18;
          --bn-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
          width: 100%;
          max-width: 100%;
          background: transparent !important;
        }
        
        .blocknote-viewer-wrapper .bn-container,
        .blocknote-viewer-wrapper .bn-editor,
        .blocknote-viewer-wrapper .bn-block-group,
        .blocknote-viewer-wrapper .bn-block-outer,
        .blocknote-viewer-wrapper .bn-block,
        .blocknote-viewer-wrapper .bn-block-content,
        .blocknote-viewer-wrapper [class*="bn-"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        .blocknote-viewer-wrapper .bn-editor {
          padding: 0;
          font-size: 16px;
          line-height: 1.75;
        }
        
        .blocknote-viewer-wrapper .bn-block-outer {
          margin: 0;
        }
        
        /* Hide the side menu in view mode */
        .blocknote-viewer-wrapper .bn-side-menu {
          display: none !important;
        }
        
        /* Hide drag handle */
        .blocknote-viewer-wrapper .bn-drag-handle {
          display: none !important;
        }
        
        /* Hide add block button */
        .blocknote-viewer-wrapper .bn-add-block-button {
          display: none !important;
        }
        
        .blocknote-viewer-wrapper .bn-block-content {
          font-size: 16px;
        }
        
        .blocknote-viewer-wrapper .bn-inline-content code {
          background-color: #eef2f7;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 14px;
          color: #c2410c;
        }

        .blocknote-viewer-wrapper [data-inline-content-type="inlineMath"],
        .blocknote-viewer-wrapper .math-inline {
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

        .blocknote-viewer-wrapper [data-inline-content-type="inlineMath"] .katex,
        .blocknote-viewer-wrapper .math-inline .katex {
          font-size: 1em;
          color: #37352f;
          line-height: 1.25;
        }

        .blocknote-viewer-wrapper [data-content-type="mathBlock"] {
          margin: 0.95rem 0;
          text-align: center;
        }

        .blocknote-viewer-wrapper [data-content-type="mathBlock"] .bn-editor-math-block,
        .blocknote-viewer-wrapper [data-content-type="mathBlock"] .math-block {
          border: 0;
          border-radius: 0;
          background: transparent;
          padding: 0.15rem 0;
          text-align: center;
        }

        .blocknote-viewer-wrapper [data-content-type="mathBlock"] .bn-editor-math-block-affordance {
          display: none !important;
        }

        .blocknote-viewer-wrapper [data-content-type="mathBlock"] .bn-editor-math-block-render .katex-display,
        .blocknote-viewer-wrapper [data-content-type="mathBlock"] .math-block .katex-display {
          margin: 0;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .blocknote-viewer-wrapper .math-empty {
          color: #9b9a97;
          font-size: 0.9em;
          font-style: italic;
        }

        .blocknote-viewer-wrapper .math-fallback {
          color: #b42318;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9em;
          white-space: pre-wrap;
        }
        
        .blocknote-viewer-wrapper pre,
        .blocknote-viewer-wrapper [data-content-type="codeBlock"] {
          background-color: #edf3fa !important;
          color: #1f2937;
          border: 1px solid #cfdae8;
          border-radius: 10px;
          padding: 16px 0;
          overflow-x: auto;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 14px;
          line-height: 1.15;
        }

        .blocknote-viewer-wrapper .bn-code-shell {
          position: relative;
        }

        .blocknote-viewer-wrapper .bn-code-shell pre {
          margin: 0;
        }

        .blocknote-viewer-wrapper .bn-code-shell pre code {
          display: block;
          counter-reset: code-line;
        }

        .blocknote-viewer-wrapper .bn-code-shell pre code .line {
          position: relative;
          display: block;
          min-height: 1.15em;
          padding: 0 1rem 0 3.25rem;
        }

        .blocknote-viewer-wrapper .bn-code-shell pre code .line::before {
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

        .blocknote-viewer-wrapper .bn-code-copy-button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          z-index: 3;
          width: 32px;
          height: 32px;
          border: 1px solid #dbe3ee;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.92) !important;
          background-color: rgba(255, 255, 255, 0.92) !important;
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

        .blocknote-viewer-wrapper .bn-code-copy-button:hover {
          border-color: #c6d4e3;
          background: #ffffff !important;
          background-color: #ffffff !important;
          color: #334155;
        }

        .blocknote-viewer-wrapper .bn-code-copy-button svg {
          width: 15px;
          height: 15px;
        }

        .blocknote-viewer-wrapper .bn-code-copy-button .icon-copied {
          display: none;
        }

        .blocknote-viewer-wrapper .bn-code-copy-button.is-copied {
          border-color: #b8deca;
          background: #edf9f1 !important;
          background-color: #edf9f1 !important;
          color: #18794e;
        }

        .blocknote-viewer-wrapper .bn-code-copy-button.is-copied .icon-copy {
          display: none;
        }

        .blocknote-viewer-wrapper .bn-code-copy-button.is-copied .icon-copied {
          display: inline-flex;
        }

        .blocknote-viewer-wrapper .bn-code-copy-button.is-error {
          border-color: #f2c8ce;
          background: #fff4f5 !important;
          background-color: #fff4f5 !important;
          color: #b42318;
        }

        .blocknote-viewer-wrapper .bn-block-content[data-content-type="codeBlock"] > div > select {
          display: none !important;
        }
        
        /* Prevent doubled heading spacing when wrapper and nested heading both get margins. */
        .blocknote-viewer-wrapper h1,
        .blocknote-viewer-wrapper h2,
        .blocknote-viewer-wrapper h3,
        .blocknote-viewer-wrapper h4 {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }

        /* Heading margins should be applied on block containers only, not inline content. */
        .blocknote-viewer-wrapper .bn-block-content[data-content-type="heading"][data-level="2"],
        .blocknote-viewer-wrapper .bn-block-content[data-content-type="heading"][data-level="3"] {
          margin: 0;
        }

        .blocknote-viewer-wrapper .bn-block-content[data-content-type="heading"][data-level="1"] {
          margin-top: 28px !important;
          margin-bottom: 8px !important;
        }

        .blocknote-viewer-wrapper [data-content-type="heading"][data-level="1"] {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 28px !important;
          margin-bottom: 8px !important;
          line-height: 1.3;
          scroll-margin-top: 50px;
        }
        
        .blocknote-viewer-wrapper [data-content-type="heading"][data-level="2"] {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 20px !important;
          margin-bottom: 8px !important;
          line-height: 1.35;
          scroll-margin-top: 50px;
        }
        
        .blocknote-viewer-wrapper [data-content-type="heading"][data-level="3"] {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 15px !important;
          margin-bottom: 8px !important;
          scroll-margin-top: 50px;
        }

        .blocknote-viewer-wrapper .bn-inline-content h1,
        .blocknote-viewer-wrapper .bn-inline-content h2,
        .blocknote-viewer-wrapper .bn-inline-content h3 {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }

        .blocknote-viewer-wrapper .bn-inline-content [data-content-type="heading"][data-level="1"],
        .blocknote-viewer-wrapper .bn-inline-content [data-content-type="heading"][data-level="2"],
        .blocknote-viewer-wrapper .bn-inline-content [data-content-type="heading"][data-level="3"] {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
        
        .blocknote-viewer-wrapper blockquote,
        .blocknote-viewer-wrapper [data-content-type="quote"] {
          border-left: 4px solid #6096ba;
          padding-left: 16px;
          color: #6b7280;
          margin: 16px 0;
          font-style: italic;
        }
        
        .blocknote-viewer-wrapper ul, 
        .blocknote-viewer-wrapper ol {
          padding-left: 1.5rem;
        }
        
        .blocknote-viewer-wrapper [data-content-type="bulletListItem"],
        .blocknote-viewer-wrapper [data-content-type="numberedListItem"] {
          margin: 4px 0;
        }
        
        .blocknote-viewer-wrapper [data-content-type="checkListItem"] input[type="checkbox"] {
          margin-right: 8px;
          width: 16px;
          height: 16px;
          accent-color: #6096ba;
        }
        
        .blocknote-viewer-wrapper a {
          color: #6096ba;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .blocknote-viewer-wrapper a:hover {
          color: #4a7a9e;
        }
        
        .blocknote-viewer-wrapper hr {
          border: none;
          border-top: 1px solid #e5e5e5;
          margin: 12px 0;
        }
        
        .blocknote-viewer-wrapper img {
          max-width: 100%;
          margin: 16px 0;
        }
        
        .blocknote-viewer-wrapper table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        
        .blocknote-viewer-wrapper th,
        .blocknote-viewer-wrapper td {
          border: 1px solid #e5e5e5;
          padding: 10px 14px;
          text-align: left;
        }
        
        .blocknote-viewer-wrapper th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        /* Preserve text colors from BlockNote */
        .blocknote-viewer-wrapper [data-text-color="red"] { color: #e03131; }
        .blocknote-viewer-wrapper [data-text-color="orange"] { color: #e8590c; }
        .blocknote-viewer-wrapper [data-text-color="yellow"] { color: #fcc419; }
        .blocknote-viewer-wrapper [data-text-color="green"] { color: #2f9e44; }
        .blocknote-viewer-wrapper [data-text-color="blue"] { color: #1971c2; }
        .blocknote-viewer-wrapper [data-text-color="purple"] { color: #9c36b5; }
        
        /* Remove background color distinctions - keep transparent */
        .blocknote-viewer-wrapper [data-background-color] {
          background-color: transparent !important;
        }
      `}</style>
    </div>
  )
}
