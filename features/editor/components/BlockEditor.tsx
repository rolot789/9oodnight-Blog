"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"
import { blockNoteSchema } from "@/features/editor/lib/blocknote-schema"
import { codeblockSafeEscapeExtension } from "@/features/editor/lib/codeblock-escape-extension"
import { mathInputRulesExtension } from "@/features/editor/lib/math-input-rules-extension"
import { getMathSlashMenuItems } from "@/features/editor/lib/math-slash-items"
import { normalizeKaTeXMarkdown } from "@/lib/shared/katex-markdown"

interface BlockEditorProps {
  initialContent?: string
  onChange: (serialized: string) => void
  editable?: boolean
}

const CONTENT_SYNC_DEBOUNCE_MS = 300

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
  return content.trim().startsWith("<") && content.includes("</")
}

export default function BlockEditor({ initialContent = "", onChange, editable = true }: BlockEditorProps) {
  const [isReady, setIsReady] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSerializedRef = useRef<string>(initialContent.trim())

  const editor = useCreateBlockNote({
    schema: blockNoteSchema,
    disableExtensions: ["OverrideEscape"],
    extensions: [codeblockSafeEscapeExtension, mathInputRulesExtension],
    domAttributes: {
      editor: {
        class: "blocknote-editor",
      },
    },
  })

  useEffect(() => {
    const loadContent = async () => {
      if (initialContent && editor && !initialLoaded) {
        try {
          if (isBlockNoteJson(initialContent)) {
            const blocks = JSON.parse(initialContent)
            editor.replaceBlocks(editor.document, blocks)
          } else if (isHTML(initialContent)) {
            const blocks = await editor.tryParseHTMLToBlocks(initialContent)
            editor.replaceBlocks(editor.document, blocks)
          } else {
            const normalizedMarkdown = normalizeKaTeXMarkdown(initialContent)
            const blocks = await editor.tryParseMarkdownToBlocks(normalizedMarkdown)
            editor.replaceBlocks(editor.document, blocks)
          }
          lastSerializedRef.current = initialContent.trim()
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
      const nextSerialized = JSON.stringify(editor.document)

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

  const getSlashItems = useCallback(
    async (query: string) => getMathSlashMenuItems(editor as any, query),
    [editor],
  )

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
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={getSlashItems}
        />
      </BlockNoteView>
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
          padding: 8px 16px 64px;
          min-height: 560px;
          font-size: 16px;
          line-height: 1.75;
          max-width: none;
          margin: 0;
        }
        
        .blocknote-wrapper .bn-block-content {
          font-size: 16px;
          color: #37352f;
        }

        @media (max-width: 768px) {
          .blocknote-wrapper .bn-editor {
            padding: 8px 16px 48px;
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
          position: relative;
          z-index: 0;
          background-color: #f7f6f3 !important;
          color: #2f3437;
          border: 1px solid #ebebe8;
          border-radius: 6px;
          padding: 2.1rem 0 0.55rem;
          overflow: hidden;
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
          overflow-x: auto;
        }

        .blocknote-wrapper .bn-block-content[data-content-type="codeBlock"] pre code {
          background: transparent !important;
          color: inherit;
        }

        .blocknote-wrapper .bn-editor-code-shell {
          position: relative;
          isolation: isolate;
          width: 100%;
        }

        .blocknote-wrapper .bn-editor-code-shell pre code {
          display: block;
        }

        .blocknote-wrapper .bn-editor-code-shell pre code .line {
          display: block;
        }

        .blocknote-wrapper .bn-editor-code-language-container {
          position: absolute;
          top: 0.4rem;
          left: 0.5rem;
          z-index: 2;
          pointer-events: none;
        }

        .blocknote-wrapper .bn-editor-code-language-container > select {
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

        .blocknote-wrapper .bn-editor-code-language-container > select:focus,
        .blocknote-wrapper .bn-editor-code-shell:hover .bn-editor-code-language-container > select {
          border-color: #b9d3e6;
          outline: none;
        }

        .blocknote-wrapper .bn-editor-code-copy-container {
          position: absolute;
          top: 0.4rem;
          right: 0.5rem;
          z-index: 2;
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
        
        /* Prevent doubled top spacing when heading wrappers/nodes both receive margin. */
        .blocknote-wrapper h1,
        .blocknote-wrapper h2,
        .blocknote-wrapper h3,
        .blocknote-wrapper h4 {
          margin: 0;
        }

        .blocknote-wrapper [data-content-type="heading"][data-level="1"] {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 14px !important;
          margin-bottom: 8px !important;
          line-height: 1.3;
        }
        
        .blocknote-wrapper [data-content-type="heading"][data-level="2"] {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 12px !important;
          margin-bottom: 8px !important;
          line-height: 1.35;
        }
        
        .blocknote-wrapper [data-content-type="heading"][data-level="3"] {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 8px !important;
          margin-bottom: 8px !important;
          line-height: 1.35;
        }
        
        .blocknote-wrapper [data-content-type="quote"] {
          color: #37352f;
          margin: 0.45rem 0;
          background: transparent;
          font-family: inherit;
          font-style: normal;
          font-size: 1rem;
          line-height: 1.5;
        }

        .blocknote-wrapper [data-content-type="quote"] blockquote {
          border-left: 4px solid rgba(55, 53, 47, 0.16);
          padding: 0.15rem 0 0.15rem 0.75rem;
          margin: 0;
          background: transparent;
          font-style: italic;
          color: inherit;
        }

        .blocknote-wrapper [data-inline-content-type="inlineMath"] {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          padding: 0 0.14rem;
          margin: 0 0.03rem;
          border-radius: 4px;
          border: 1px solid transparent;
          background: transparent;
          vertical-align: baseline;
          cursor: pointer;
          transition: border-color 0.12s ease, background-color 0.12s ease;
        }

        .blocknote-wrapper [data-inline-content-type="inlineMath"]:hover,
        .blocknote-wrapper [data-inline-content-type="inlineMath"]:focus-within {
          border-color: #ebe9e5;
          background: #f7f6f4;
        }

        .blocknote-wrapper .bn-editor-inline-math-render {
          display: inline-flex;
          align-items: center;
          min-height: 1.24em;
        }

        .blocknote-wrapper .bn-editor-inline-math-render .katex {
          font-size: 1em;
          color: #37352f;
          line-height: 1.25;
        }

        .blocknote-wrapper [data-content-type="mathBlock"] {
          margin: 0.9rem 0;
        }

        .blocknote-wrapper .bn-editor-math-block {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          padding: 0.56rem 0.25rem;
          min-height: 80px;
          line-height: 1;
          text-align: center;
          cursor: pointer;
          width: 100%;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .blocknote-wrapper .bn-editor-math-block:hover,
        .blocknote-wrapper .bn-editor-math-block:focus-within {
          border-color: #eeece8;
          background: #faf9f8;
        }

        .blocknote-wrapper .bn-editor-math-block-render {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          overflow-x: auto;
        }

        .blocknote-wrapper .bn-editor-math-block-render .katex-display {
          margin: 0 auto;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0;
        }

        .blocknote-wrapper .bn-editor-math-block-affordance {
          position: absolute;
          left: 50%;
          bottom: 0.18rem;
          transform: translateX(-50%);
          font-size: 11px;
          color: #a4a39f;
          opacity: 0;
          line-height: 1;
          white-space: nowrap;
          pointer-events: none;
          transition: opacity 0.14s ease;
          text-transform: lowercase;
        }

        .blocknote-wrapper .bn-editor-math-block:hover .bn-editor-math-block-affordance,
        .blocknote-wrapper .bn-editor-math-block:focus-within .bn-editor-math-block-affordance {
          opacity: 1;
        }

        .bn-editor-math-popover {
          background: #ffffff;
          border: 1px solid #e8e6e2;
          border-radius: 10px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
          padding: 0.4rem;
          min-width: 320px;
          width: min(540px, calc(100vw - 24px));
        }

        .bn-editor-math-popover-row {
          display: flex;
          align-items: center;
          gap: 0.48rem;
        }

        .bn-editor-math-popover-input {
          flex: 1;
          min-width: 0;
          width: 100%;
          border: 1px solid #eceae5;
          border-radius: 7px;
          background: #faf9f7;
          color: #37352f;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 13px;
          line-height: 1.3;
          padding: 0 0.58rem;
          resize: none;
          height: 30px;
          min-height: 30px;
          max-height: 30px;
          overflow: hidden;
          white-space: nowrap;
          transition: border-color 0.14s ease, background-color 0.14s ease, box-shadow 0.14s ease;
        }

        .bn-editor-math-popover-input:focus {
          outline: none;
          border-color: #c9d8e5;
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(96, 150, 186, 0.12);
        }

        .bn-editor-math-popover-save {
          flex-shrink: 0;
          border: 1px solid #d9d7d2;
          border-radius: 7px;
          height: 30px;
          padding: 0 0.76rem;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
          background: #ffffff;
          color: #595753;
          cursor: pointer;
          transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease;
        }

        .bn-editor-math-popover-save:hover {
          background: #f4f3f1;
          border-color: #cfcac2;
          color: #2f2e2a;
        }

        .blocknote-wrapper .math-empty {
          color: #9b9a97;
          font-size: 0.9em;
          font-style: italic;
        }

        .blocknote-wrapper .math-fallback {
          color: #b42318;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.9em;
          white-space: pre-wrap;
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
