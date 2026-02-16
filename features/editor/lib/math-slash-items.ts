import type {
  BlockNoteEditor,
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
} from "@blocknote/core"
import { TextSelection } from "@tiptap/pm/state"
import { createElement } from "react"
import {
  CodeXml,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Music3,
  Quote,
  Smile,
  Table2,
  Text,
  Video,
} from "lucide-react"
import {
  filterSuggestionItems,
  getDefaultSlashMenuItems,
  insertOrUpdateBlockForSlashMenu,
} from "@blocknote/core/extensions"
import type { DefaultReactSuggestionItem } from "@blocknote/react"

const slashMenuIcons = {
  heading: Heading1,
  heading_2: Heading2,
  heading_3: Heading3,
  heading_4: Heading4,
  heading_5: Heading5,
  heading_6: Heading6,
  toggle_heading: Heading1,
  toggle_heading_2: Heading2,
  toggle_heading_3: Heading3,
  quote: Quote,
  toggle_list: ListChecks,
  numbered_list: ListOrdered,
  bullet_list: List,
  check_list: ListChecks,
  paragraph: Text,
  table: Table2,
  image: Image,
  video: Video,
  audio: Music3,
  file: FileText,
  emoji: Smile,
  code_block: CodeXml,
  divider: Minus,
  page_break: Minus,
} as const

function insertInlineMathFromSlash<
  BSchema extends BlockSchema,
  ISchema extends InlineContentSchema,
  SSchema extends StyleSchema,
>(editor: BlockNoteEditor<BSchema, ISchema, SSchema>) {
  editor.transact((tr) => {
    const from = tr.selection.from
    const to = tr.selection.to
    const blockStart = tr.selection.$from.start()
    const textBeforeCursor = tr.doc.textBetween(blockStart, from, "\0", "\0")
    const slashOffset = textBeforeCursor.lastIndexOf("/")

    if (slashOffset === -1) {
      return
    }

    const slashFrom = blockStart + slashOffset
    tr.delete(slashFrom, to)
    tr.setSelection(TextSelection.create(tr.doc, slashFrom))
  })

  editor.insertInlineContent(
    [
      {
        type: "inlineMath",
        props: {
          latex: "",
        },
      },
    ] as any,
    { updateSelection: true },
  )
}

function createMathMenuIcon(symbol: string) {
  return createElement(
    "span",
    {
      "aria-hidden": "true",
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "18px",
        height: "18px",
        fontSize: "15px",
        lineHeight: 1,
        fontWeight: 600,
        color: "currentColor",
      },
    },
    symbol,
  )
}

function createMathSlashItems<
  BSchema extends BlockSchema,
  ISchema extends InlineContentSchema,
  SSchema extends StyleSchema,
>(editor: BlockNoteEditor<BSchema, ISchema, SSchema>): DefaultReactSuggestionItem[] {
  return [
    {
      title: "Math Block",
      subtext: "Display equation",
      aliases: ["math", "equation", "formula", "latex", "display math"],
      group: "Basic blocks",
      icon: createMathMenuIcon("∑"),
      onItemClick: () => {
        insertOrUpdateBlockForSlashMenu(editor as any, {
          type: "mathBlock",
          props: {
            latex: "",
          },
        } as any)
      },
    },
    {
      title: "Inline Math",
      subtext: "Inline equation",
      aliases: ["inline math", "equation", "latex", "formula", "math inline"],
      group: "Basic blocks",
      icon: createMathMenuIcon("ƒx"),
      onItemClick: () => {
        insertInlineMathFromSlash(editor)
      },
    },
  ]
}

export async function getMathSlashMenuItems<
  BSchema extends BlockSchema,
  ISchema extends InlineContentSchema,
  SSchema extends StyleSchema,
>(
  editor: BlockNoteEditor<BSchema, ISchema, SSchema>,
  query: string,
) {
  const defaultItems = getDefaultSlashMenuItems(editor)
    .map((item) => {
      const Icon = slashMenuIcons[item.key as keyof typeof slashMenuIcons]

      if (!Icon) {
        return item
      }

      return {
        ...item,
        icon: createElement(Icon, { size: 18 }),
      } as DefaultReactSuggestionItem
    }) as DefaultReactSuggestionItem[]
  const mathItems = createMathSlashItems(editor)
  const filteredItems = filterSuggestionItems([...defaultItems, ...mathItems], query)

  const groupedItems = new Map<string, DefaultReactSuggestionItem[]>()
  const groupedOrder: string[] = []

  filteredItems.forEach((item, index) => {
    const group = item.group ?? `__group_${index}`

    if (!groupedItems.has(group)) {
      groupedItems.set(group, [])
      groupedOrder.push(group)
    }

    groupedItems.get(group)!.push(item)
  })

  return groupedOrder.flatMap((group) => groupedItems.get(group) ?? [])
}
