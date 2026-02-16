import { createExtension } from "@blocknote/core"

type BlockSchemaEntry = {
  content?: string
}

export const codeblockSafeEscapeExtension = createExtension({
  key: "codeblock-safe-escape",
  keyboardShortcuts: {
    Escape: ({ editor }) => {
      const suggestionMenu = editor.getExtension("suggestionMenu") as
        | { shown?: () => boolean; closeMenu?: () => void }
        | undefined

      if (suggestionMenu?.shown?.()) {
        suggestionMenu.closeMenu?.()
        return true
      }

      const { block } = editor.getTextCursorPosition()
      if (block.type !== "codeBlock") {
        editor.blur()
        return true
      }

      editor.transact(() => {
        const { block: currentBlock, nextBlock } = editor.getTextCursorPosition()
        const blockSchema = editor.schema.blockSchema as Record<string, BlockSchemaEntry>
        const nextBlockContent = nextBlock ? blockSchema[nextBlock.type]?.content : undefined

        if (nextBlock && nextBlockContent === "inline") {
          editor.setTextCursorPosition(nextBlock, "start")
          return
        }

        const [paragraphBlock] = editor.insertBlocks(
          [{ type: "paragraph" }],
          currentBlock,
          "after",
        )
        if (paragraphBlock) {
          editor.setTextCursorPosition(paragraphBlock, "start")
        }
      })

      editor.focus()
      return true
    },
  },
})
