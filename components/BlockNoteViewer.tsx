"use client"

import { useEffect, useRef, useState } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"
import { blockNoteSchema } from "@/features/editor/lib/blocknote-schema"
import renderMathInElement from "katex/contrib/auto-render"
import { copyText } from "@/lib/shared/clipboard"
import { isBlockNoteJson, isHtmlContent } from "@/lib/shared/content"
import { createHeadingSlug } from "@/lib/shared/slug"
import { KATEX_DELIMITERS } from "@/lib/shared/katex-render"
import { sanitizeHtmlContent } from "@/lib/shared/security"
import { blockNoteViewerStyles } from "./blocknote-viewer-styles"

interface BlockNoteViewerProps {
  content: string
  className?: string
}

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

export default function BlockNoteViewer({ content, className = "" }: BlockNoteViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [fallbackText, setFallbackText] = useState<string>("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  const editor = useCreateBlockNote({
    schema: blockNoteSchema,
    domAttributes: {
      editor: {
        class: "blocknote-viewer",
      },
    },
  })

  const getPlainFallback = (rawContent: string) => {
    const sanitized = sanitizeHtmlContent(rawContent)
    return sanitized
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim()
      || "Unable to render this content."
  }

  // Load content into the editor
  useEffect(() => {
    const loadContent = async () => {
      setParseError(null)
      setFallbackText("")

      if (content && editor) {
        try {
          let blocks
          if (isBlockNoteJson(content)) {
            blocks = JSON.parse(content)
          } else if (isHtmlContent(content)) {
            blocks = await editor.tryParseHTMLToBlocks(content)
          } else {
            blocks = await editor.tryParseMarkdownToBlocks(content)
          }
          if (!Array.isArray(blocks)) {
            throw new Error("Unsupported BlockNote content format.")
          }
          editor.replaceBlocks(editor.document, blocks)
        } catch (error) {
          console.error("Failed to parse content:", error)
          setParseError(
            error instanceof Error
              ? error.message
              : "Failed to parse BlockNote content."
          )
          setFallbackText(getPlainFallback(content))
        }
      }
      setIsLoaded(true)
    }
    loadContent()
  }, [content, editor])

  // Add IDs to headings after content is loaded for ToC
  useEffect(() => {
    if (!isLoaded || parseError) return
    
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
          heading.id = createHeadingSlug(heading.textContent, index)
        }
      })
    }
    
    // Small delay to ensure BlockNote has rendered
    const timeoutId = setTimeout(addHeadingIds, 200)
    return () => clearTimeout(timeoutId)
  }, [isLoaded, parseError])

  useEffect(() => {
    if (!isLoaded || parseError) return

    const wrapper = wrapperRef.current
    if (!wrapper) return

    try {
      renderMathInElement(wrapper, {
        delimiters: [...KATEX_DELIMITERS],
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
  }, [content, isLoaded, parseError])

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

  if (parseError) {
    return (
      <div className={`w-full text-sm text-[#6b7280] ${className}`}>
        <p className="mb-2 text-xs text-[#9ca3af]">Unable to render editor content.</p>
        <pre className="whitespace-pre-wrap break-words">{fallbackText}</pre>
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
      <style jsx global>{blockNoteViewerStyles}</style>
    </div>
  )
}
