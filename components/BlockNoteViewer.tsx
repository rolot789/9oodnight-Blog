"use client"

import { useEffect, useState } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"

interface BlockNoteViewerProps {
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

  const editor = useCreateBlockNote({
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
          if (isHTML(content)) {
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
    <div className={`blocknote-viewer-wrapper ${className}`}>
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
          background-color: #f0f0f0;
          padding: 2px 6px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 14px;
          color: #e11d48;
        }
        
        .blocknote-viewer-wrapper pre,
        .blocknote-viewer-wrapper [data-content-type="codeBlock"] {
          background-color: #1e1e1e !important;
          color: #d4d4d4;
          padding: 16px 20px;
          overflow-x: auto;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .blocknote-viewer-wrapper h1,
        .blocknote-viewer-wrapper [data-level="1"] {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
          scroll-margin-top: 50px;
        }
        
        .blocknote-viewer-wrapper h2,
        .blocknote-viewer-wrapper [data-level="2"] {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
          line-height: 1.35;
          scroll-margin-top: 50px;
        }
        
        .blocknote-viewer-wrapper h3,
        .blocknote-viewer-wrapper [data-level="3"] {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          scroll-margin-top: 50px;
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
          margin: 24px 0;
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
