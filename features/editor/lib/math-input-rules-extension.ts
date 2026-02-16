import { createExtension } from "@blocknote/core"
import { Extension, InputRule } from "@tiptap/core"
import type { EditorState } from "@tiptap/pm/state"

function isCodeContext(state: EditorState, position: number): boolean {
  const resolvedPosition = state.doc.resolve(
    Math.max(0, Math.min(position, state.doc.content.size)),
  )

  if (resolvedPosition.parent.type.spec.code || resolvedPosition.parent.type.name === "codeBlock") {
    return true
  }

  const codeMark = state.schema.marks.code
  if (!codeMark) {
    return false
  }

  const activeMarks = [...resolvedPosition.marks(), ...(state.storedMarks ?? [])]
  return activeMarks.some((mark) => mark.type === codeMark)
}

function shouldSkipBlockMathRule(editor: any): boolean {
  const { block } = editor.getTextCursorPosition()
  if (block.type === "codeBlock") {
    return true
  }

  const activeStyles = editor.getActiveStyles() as Record<string, unknown>
  return Boolean(activeStyles.code)
}

const inlineMathInputRuleExtension = Extension.create({
  name: "inline-math-input-rule",
  addInputRules() {
    if (!this.editor.schema.nodes.inlineMath) {
      return []
    }

    return [
      new InputRule({
        find: /(^|[\s(])\$([^$\n]+)\$$/,
        handler: ({ state, range, match }) => {
          const inlineMathNode = this.editor.schema.nodes.inlineMath
          if (!inlineMathNode) {
            return null
          }

          if (isCodeContext(state, range.from)) {
            return null
          }

          const prefix = match[1] ?? ""
          const latex = (match[2] ?? "").trim()

          if (!latex) {
            return null
          }

          const replacementContent = []
          if (prefix) {
            replacementContent.push({
              type: "text",
              text: prefix,
            })
          }
          replacementContent.push({
            type: inlineMathNode.name,
            attrs: { latex },
          })

          this.editor
            .chain()
            .insertContentAt(
              {
                from: range.from,
                to: range.to,
              },
              replacementContent,
            )
            .run()

          return null
        },
      }),
    ]
  },
})

export const mathInputRulesExtension = createExtension({
  key: "math-input-rules",
  inputRules: [
    {
      find: /^\$\$$/,
      replace: ({ editor }) => {
        if (shouldSkipBlockMathRule(editor)) {
          return undefined
        }

        return {
          type: "mathBlock",
          props: {
            latex: "",
          },
        } as any
      },
    },
    {
      find: /^\$\$([\s\S]+)\$\$$/,
      replace: ({ match, editor }) => {
        if (shouldSkipBlockMathRule(editor)) {
          return undefined
        }

        const latex = (match[1] ?? "").trim()
        return {
          type: "mathBlock",
          props: {
            latex,
          },
        } as any
      },
    },
  ],
  tiptapExtensions: [inlineMathInputRuleExtension],
})
