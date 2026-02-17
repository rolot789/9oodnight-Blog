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
import { isBlockNoteJson, isHtmlContent } from "@/lib/shared/content"
import { blockEditorStyles } from "./block-editor-styles"

interface BlockEditorProps {
  initialContent?: string
  onChange: (serialized: string) => void
  editable?: boolean
}

const CONTENT_SYNC_DEBOUNCE_MS = 300

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
          } else if (isHtmlContent(initialContent)) {
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
      <style jsx global>{blockEditorStyles}</style>
    </div>
  )
}
