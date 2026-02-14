"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"
import { blockNoteSchema } from "@/features/editor/lib/blocknote-schema"
import { containsKaTeXMathDelimiters, normalizeKaTeXMarkdown } from "@/lib/shared/katex-markdown"

interface BlockEditorProps {
  initialContent?: string
  onChange: (serialized: string) => void
  editable?: boolean
}

const CONTENT_SYNC_DEBOUNCE_MS = 300

function isHTML(content: string): boolean {
  return content.trim().startsWith("<") && content.includes("</")
}

function normalizeSerializedContent(content: string): string {
  return content.trim()
}

function selectSerializedContent(html: string, markdown: string): string {
  const normalizedHtml = normalizeSerializedContent(html)
  const normalizedMarkdown = normalizeSerializedContent(normalizeKaTeXMarkdown(markdown))

  if (containsKaTeXMathDelimiters(normalizedMarkdown)) {
    return normalizedMarkdown
  }

  return normalizedHtml
}

export default function BlockEditor({ initialContent = "", onChange, editable = true }: BlockEditorProps) {
  const [isReady, setIsReady] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSerializedRef = useRef<string>(normalizeSerializedContent(initialContent))

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
          let blocks
          if (isHTML(initialContent)) {
            // Parse HTML content
            blocks = await editor.tryParseHTMLToBlocks(initialContent)
          } else {
            // Parse Markdown content (backwards compatibility)
            const normalizedMarkdown = normalizeKaTeXMarkdown(initialContent)
            blocks = await editor.tryParseMarkdownToBlocks(normalizedMarkdown)
            lastSerializedRef.current = normalizeSerializedContent(normalizedMarkdown)
          }
          editor.replaceBlocks(editor.document, blocks)
          if (isHTML(initialContent)) {
            lastSerializedRef.current = normalizeSerializedContent(initialContent)
          }
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
      const html = editor.blocksToHTMLLossy(editor.document)
      const markdown = editor.blocksToMarkdownLossy(editor.document)
      const nextSerialized = selectSerializedContent(html, markdown)

      if (nextSerialized === lastSerializedRef.current) {
        return
      }
      lastSerializedRef.current = nextSerialized
      onChange(nextSerialized)
    } catch (error) {
      console.error("Failed to serialize editor content:", error)
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
    <div className="blocknote-wrapper w-full min-h-[500px] border border-[#e5e5e5] bg-white rounded-none overflow-hidden">
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
          --bn-font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }
        
        .blocknote-wrapper .bn-editor {
          padding: 8px 96px 64px;
          min-height: 560px;
          font-size: 16px;
          line-height: 1.75;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .blocknote-wrapper .bn-block-content {
          font-size: 16px;
          color: #37352f;
        }

        @media (max-width: 768px) {
          .blocknote-wrapper .bn-editor {
            padding: 8px 20px 48px;
            min-height: 500px;
          }
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
        
        .blocknote-wrapper [data-content-type="codeBlock"] {
          background-color: #f7f6f3 !important;
          color: #2f3437;
          border: 1px solid #ebebe8;
          border-radius: 6px;
          padding: 2.1rem 0 0.55rem;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 13px;
          line-height: 1.5;
        }

        .blocknote-wrapper .bn-block-content[data-content-type="codeBlock"] pre {
          margin: 0;
          padding: 0 0.875rem;
          background: transparent !important;
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }

        .blocknote-wrapper .bn-block-content[data-content-type="codeBlock"] pre code {
          background: transparent !important;
          color: inherit;
        }

        .blocknote-wrapper .bn-editor-code-shell {
          position: relative;
        }

        .blocknote-wrapper .bn-editor-code-shell pre code {
          display: block;
        }

        .blocknote-wrapper .bn-editor-code-shell pre code .line {
          display: block;
        }

        .blocknote-wrapper .bn-editor-code-shell > div:first-child {
          position: absolute;
          top: 0.4rem;
          left: 0.5rem;
          z-index: 4;
          pointer-events: none;
        }

        .blocknote-wrapper .bn-editor-code-shell > div:first-child > select {
          pointer-events: auto;
          opacity: 1;
          height: 24px;
          min-width: 96px;
          padding: 0 0.5rem;
          border-radius: 6px;
          border: 1px solid #deded9;
          background-color: #ffffff;
          color: #2f3437;
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.01em;
        }

        .blocknote-wrapper .bn-editor-code-shell > div:first-child > select:focus,
        .blocknote-wrapper .bn-editor-code-shell:hover > div:first-child > select {
          border-color: #b9d3e6;
          outline: none;
        }

        .blocknote-wrapper .bn-editor-code-copy-container {
          position: absolute;
          top: 0.4rem;
          right: 0.5rem;
          z-index: 4;
          pointer-events: none;
        }

        .blocknote-wrapper .bn-editor-code-copy-button {
          pointer-events: auto;
          width: 24px;
          height: 24px;
          border: 1px solid #deded9;
          border-radius: 6px;
          background: #ffffff;
          color: #5f6368;
          cursor: pointer;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .blocknote-wrapper .bn-editor-code-copy-button:hover {
          border-color: #b9d3e6;
          color: #2f3437;
        }

        .blocknote-wrapper .bn-editor-code-copy-button svg {
          width: 13px;
          height: 13px;
        }

        .blocknote-wrapper .bn-editor-code-copy-button .icon-copied {
          display: none;
        }

        .blocknote-wrapper .bn-editor-code-copy-button.is-copied {
          border-color: #cfe8d9;
          background: #f3fbf7;
          color: #18794e;
        }

        .blocknote-wrapper .bn-editor-code-copy-button.is-copied .icon-copy {
          display: none;
        }

        .blocknote-wrapper .bn-editor-code-copy-button.is-copied .icon-copied {
          display: inline-flex;
        }

        .blocknote-wrapper .bn-editor-code-copy-button.is-error {
          border-color: #f4d6da;
          background: #fff7f8;
          color: #b42318;
        }
        
        .blocknote-wrapper h1,
        .blocknote-wrapper [data-level="1"] {
          font-size: 2.5rem;
          font-weight: 700;
          margin-top: 1.15em;
          margin-bottom: 0.2em;
          line-height: 1.2;
        }
        
        .blocknote-wrapper h2,
        .blocknote-wrapper [data-level="2"] {
          font-size: 1.875rem;
          font-weight: 600;
          margin-top: 1.2em;
          margin-bottom: 0.15em;
          line-height: 1.3;
        }
        
        .blocknote-wrapper h3,
        .blocknote-wrapper [data-level="3"] {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.1em;
          margin-bottom: 0.1em;
          line-height: 1.3;
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
