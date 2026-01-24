"use client"

import { useEffect, useState, useCallback } from "react"
import { BlockNoteEditor } from "@blocknote/core"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"

interface BlockEditorProps {
  initialContent?: string
  onChange: (html: string) => void
  editable?: boolean
}

export default function BlockEditor({ initialContent = "", onChange, editable = true }: BlockEditorProps) {
  const [isReady, setIsReady] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)

  const editor = useCreateBlockNote({
    domAttributes: {
      editor: {
        class: "blocknote-editor",
      },
    },
  })

  // Detect if content is HTML or Markdown
  const isHTML = (content: string) => {
    return content.trim().startsWith('<') && content.includes('</');
  }

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
          setInitialLoaded(true)
        } catch (error) {
          console.error("Failed to parse content:", error)
        }
      }
      setIsReady(true)
    }
    loadContent()
  }, [editor, initialContent, initialLoaded])

  // Handle content changes - save as HTML to preserve all formatting
  const handleChange = useCallback(async () => {
    if (!editor || !isReady) return
    try {
      const html = await editor.blocksToHTMLLossy(editor.document)
      onChange(html)
    } catch (error) {
      console.error("Failed to convert to HTML:", error)
    }
  }, [editor, isReady, onChange])

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
        
        .blocknote-wrapper .bn-block-outer:hover .bn-side-menu {
          opacity: 1;
        }
        
        .blocknote-wrapper .bn-side-menu {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        
        .blocknote-wrapper .bn-inline-content code {
          background-color: #f0f0f0;
          padding: 2px 6px;
          border-radius: 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 13px;
          color: #e11d48;
        }
        
        .blocknote-wrapper pre,
        .blocknote-wrapper [data-content-type="codeBlock"] {
          background-color: #1e1e1e !important;
          color: #d4d4d4;
          padding: 16px 20px;
          border-radius: 0;
          overflow-x: auto;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 13px;
          line-height: 1.5;
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
