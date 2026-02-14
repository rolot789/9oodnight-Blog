"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"
import { blockNoteSchema } from "@/features/editor/lib/blocknote-schema"

interface BlockEditorProps {
  initialContent?: string
  onChange: (html: string) => void
  editable?: boolean
}

const CONTENT_SYNC_DEBOUNCE_MS = 300
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

function isHTML(content: string): boolean {
  return content.trim().startsWith("<") && content.includes("</")
}

function normalizeSerializedContent(content: string): string {
  return content.trim()
}

export default function BlockEditor({ initialContent = "", onChange, editable = true }: BlockEditorProps) {
  const [isReady, setIsReady] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSerializedRef = useRef<string>(normalizeSerializedContent(initialContent))
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const editor = useCreateBlockNote({
    schema: blockNoteSchema,
    domAttributes: {
      editor: {
        class: "blocknote-editor",
      },
    },
  })

  // Load initial content (supports both HTML and Markdown for backwards compatibility)
  useEffect(() => {
    const loadContent = async () => {
      if (initialContent && editor && !initialLoaded) {
        try {
          let blocks;
          if (isHTML(initialContent)) {
            // Parse HTML content
            blocks = await editor.tryParseHTMLToBlocks(initialContent)
          } else {
            // Parse Markdown content (backwards compatibility)
            blocks = await editor.tryParseMarkdownToBlocks(initialContent)
          }
          editor.replaceBlocks(editor.document, blocks)
          lastSerializedRef.current = normalizeSerializedContent(initialContent)
          setInitialLoaded(true)
        } catch (error) {
          console.error("Failed to parse content:", error)
        }
      }
      setIsReady(true)
    }
    loadContent()
  }, [editor, initialContent, initialLoaded])

  const emitContentChange = useCallback(async () => {
    if (!editor || !isReady) return
    try {
      const html = normalizeSerializedContent(
        await editor.blocksToHTMLLossy(editor.document)
      )
      if (html === lastSerializedRef.current) {
        return
      }
      lastSerializedRef.current = html
      onChange(html)
    } catch (error) {
      console.error("Failed to convert to HTML:", error)
    }
  }, [editor, isReady, onChange])

  // Debounce expensive serialization to reduce editor typing cost.
  const handleChange = useCallback(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }
    syncTimerRef.current = setTimeout(() => {
      void emitContentChange()
    }, CONTENT_SYNC_DEBOUNCE_MS)
  }, [emitContentChange])

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
        syncTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isReady) return

    const container = editorContainerRef.current
    if (!container) return

    const attachCopyButtons = () => {
      const codeBlocks = Array.from(container.querySelectorAll<HTMLPreElement>("pre"))

      for (const pre of codeBlocks) {
        const shell =
          pre.closest<HTMLElement>('.bn-block-content[data-content-type="codeBlock"]') ??
          pre.parentElement
        if (!shell) continue

        shell.classList.add("bn-editor-code-shell")
        if (shell.querySelector(".bn-editor-code-copy-button")) {
          continue
        }

        const button = document.createElement("button")
        button.type = "button"
        button.className = "bn-editor-code-copy-button"
        button.setAttribute("aria-label", "Copy code")
        button.setAttribute("title", "Copy code")
        button.innerHTML = `
          <span class="icon-copy">${COPY_ICON}</span>
          <span class="icon-copied">${COPIED_ICON}</span>
        `
        shell.appendChild(button)
      }
    }

    attachCopyButtons()

    let frameId = 0
    const observer = new MutationObserver(() => {
      if (frameId) return
      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        attachCopyButtons()
      })
    })
    observer.observe(container, {
      childList: true,
      subtree: true,
    })

    const resetTimers = new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>()

    const resetButtonState = (button: HTMLButtonElement) => {
      button.classList.remove("is-copied", "is-error")
      button.setAttribute("aria-label", "Copy code")
      button.setAttribute("title", "Copy code")
    }

    const handleCopyClick = async (event: Event) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest<HTMLButtonElement>(".bn-editor-code-copy-button")
      if (!button || !container.contains(button)) return

      const shell = button.closest<HTMLElement>(".bn-editor-code-shell")
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

    container.addEventListener("click", handleCopyClick)

    return () => {
      container.removeEventListener("click", handleCopyClick)
      observer.disconnect()
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      for (const timer of resetTimers.values()) {
        clearTimeout(timer)
      }
      resetTimers.clear()
    }
  }, [isReady])

  if (!isReady) {
    return (
      <div className="w-full min-h-[500px] border border-[#e5e5e5] bg-white rounded-none flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#8b8c89]">
          <div className="w-5 h-5 border-2 border-[#6096ba] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading editor...</span>
        </div>
      </div>
    )
  }

  return (
    <div ref={editorContainerRef} className="blocknote-wrapper w-full min-h-[500px] border border-[#e5e5e5] bg-white rounded-none overflow-hidden">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme="light"
      />
      <style jsx global>{`
        .blocknote-wrapper {
          --bn-colors-editor-background: #ffffff;
          --bn-colors-editor-text: #080f18;
          --bn-colors-menu-background: #ffffff;
          --bn-colors-menu-text: #080f18;
          --bn-colors-tooltip-background: #080f18;
          --bn-colors-tooltip-text: #ffffff;
          --bn-colors-hovered-background: #f5f5f5;
          --bn-colors-selected-background: #e8f4fc;
          --bn-colors-disabled-background: #f0f0f0;
          --bn-colors-disabled-text: #8b8c89;
          --bn-colors-shadow: rgba(0, 0, 0, 0.08);
          --bn-colors-border: #e5e5e5;
          --bn-colors-side-menu: #c0c0c0;
          --bn-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
        }
        
        .blocknote-wrapper .bn-editor {
          padding: 24px 28px;
          min-height: 500px;
          font-size: 15px;
          line-height: 1.7;
        }
        
        .blocknote-wrapper .bn-block-content {
          font-size: 15px;
        }
        
        .blocknote-wrapper .bn-block-outer {
          margin: 0;
        }
        
        /* Side menu (drag handle + add button) */
        .blocknote-wrapper .bn-side-menu {
          opacity: 0;
          transition: opacity 0.15s ease;
          display: flex !important;
          visibility: visible !important;
        }
        
        .blocknote-wrapper .bn-block-outer:hover .bn-side-menu,
        .blocknote-wrapper .bn-side-menu:hover {
          opacity: 1;
        }
        
        .blocknote-wrapper .bn-drag-handle,
        .blocknote-wrapper .bn-add-block-button {
          display: flex !important;
          visibility: visible !important;
        }
        
        .blocknote-wrapper .bn-inline-content code {
          background-color: #eef2f7;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 13px;
          color: #c2410c;
        }
        
        .blocknote-wrapper pre,
        .blocknote-wrapper [data-content-type="codeBlock"] {
          background-color: #edf3fa !important;
          color: #1f2937;
          padding: 16px 0;
          border-radius: 10px;
          border: 1px solid #cfdae8;
          overflow-x: auto;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 13px;
          line-height: 1.15;
        }

        .blocknote-wrapper .bn-block-content[data-content-type="codeBlock"] pre {
          margin: 0;
          padding: 0 1rem;
        }

        .blocknote-wrapper .bn-editor-code-shell {
          position: relative;
        }

        .blocknote-wrapper .bn-editor-code-shell pre code {
          display: block;
          counter-reset: code-line;
        }

        .blocknote-wrapper .bn-editor-code-shell pre code .line {
          position: relative;
          display: block;
          min-height: 1.15em;
          padding: 0 1rem 0 3.25rem;
        }

        .blocknote-wrapper .bn-editor-code-shell pre code .line::before {
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

        .blocknote-wrapper .bn-editor-code-copy-button {
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

        .blocknote-wrapper .bn-editor-code-copy-button:hover {
          border-color: #c6d4e3;
          background: #ffffff;
          color: #334155;
        }

        .blocknote-wrapper .bn-editor-code-copy-button svg {
          width: 15px;
          height: 15px;
        }

        .blocknote-wrapper .bn-editor-code-copy-button .icon-copied {
          display: none;
        }

        .blocknote-wrapper .bn-editor-code-copy-button.is-copied {
          border-color: #b8deca;
          background: #edf9f1;
          color: #18794e;
        }

        .blocknote-wrapper .bn-editor-code-copy-button.is-copied .icon-copy {
          display: none;
        }

        .blocknote-wrapper .bn-editor-code-copy-button.is-copied .icon-copied {
          display: inline-flex;
        }

        .blocknote-wrapper .bn-editor-code-copy-button.is-error {
          border-color: #f2c8ce;
          background: #fff4f5;
          color: #b42318;
        }

        .blocknote-wrapper .bn-block-content[data-content-type="codeBlock"] > div > select {
          top: 10px;
          left: 14px;
          opacity: 0.98 !important;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #ccd7e4;
          background-color: rgba(255, 255, 255, 0.96);
          color: #334155;
          font-size: 11px;
          letter-spacing: 0.01em;
        }

        .blocknote-wrapper .bn-block-content[data-content-type="codeBlock"] > div > select:focus,
        .blocknote-wrapper .bn-block-content[data-content-type="codeBlock"]:hover > div > select {
          opacity: 1 !important;
          border-color: #a8bad0;
        }
        
        .blocknote-wrapper h1,
        .blocknote-wrapper [data-level="1"] {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
        
        .blocknote-wrapper h2,
        .blocknote-wrapper [data-level="2"] {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
          line-height: 1.35;
        }
        
        .blocknote-wrapper h3,
        .blocknote-wrapper [data-level="3"] {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .blocknote-wrapper blockquote,
        .blocknote-wrapper [data-content-type="quote"] {
          border-left: 4px solid #6096ba;
          padding-left: 16px;
          color: #6b7280;
          margin: 16px 0;
          font-style: italic;
        }
        
        .blocknote-wrapper ul, 
        .blocknote-wrapper ol {
          padding-left: 1.5rem;
        }
        
        .blocknote-wrapper [data-content-type="bulletListItem"],
        .blocknote-wrapper [data-content-type="numberedListItem"] {
          margin: 4px 0;
        }
        
        .blocknote-wrapper [data-content-type="checkListItem"] {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        
        .blocknote-wrapper [data-content-type="checkListItem"] input[type="checkbox"] {
          margin-top: 4px;
          width: 16px;
          height: 16px;
          accent-color: #6096ba;
        }
        
        .blocknote-wrapper a {
          color: #6096ba;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .blocknote-wrapper a:hover {
          color: #4a7a9e;
        }
        
        .blocknote-wrapper hr {
          border: none;
          border-top: 1px solid #e5e5e5;
          margin: 24px 0;
        }
        
        .blocknote-wrapper img {
          max-width: 100%;
          border-radius: 0;
          margin: 16px 0;
        }
        
        .blocknote-wrapper table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        
        .blocknote-wrapper th,
        .blocknote-wrapper td {
          border: 1px solid #e5e5e5;
          padding: 10px 14px;
          text-align: left;
        }
        
        .blocknote-wrapper th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        /* Slash menu styling */
        .bn-slash-menu {
          border-radius: 0 !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
          border: 1px solid #e5e5e5 !important;
        }
        
        .bn-slash-menu-item {
          border-radius: 0 !important;
          margin: 2px 4px !important;
        }
        
        .bn-slash-menu-item:hover {
          background-color: #f5f5f5 !important;
        }
        
        /* Toolbar styling */
        .bn-toolbar {
          border-radius: 0 !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1) !important;
        }
        
        /* Placeholder styling */
        .blocknote-wrapper .bn-block-content[data-is-empty-and-focused="true"]::before,
        .blocknote-wrapper .bn-inline-content[data-placeholder]::before {
          color: #c0c0c0;
          font-style: normal;
        }
      `}</style>
    </div>
  )
}
