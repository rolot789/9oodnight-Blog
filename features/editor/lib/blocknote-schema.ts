import {
  BlockNoteSchema,
  createBlockConfig,
  createBlockSpec,
  createCodeBlockSpec,
  createInlineContentSpec,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from "@blocknote/core"
import type { CodeBlockOptions } from "@blocknote/core"
import { copyText } from "@/lib/shared/clipboard"
import { getHighlighter } from "@/lib/shared/highlight"
import { renderMathHtml } from "@/lib/shared/katex-render"
import { createMathPopover } from "./math-popover"

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

const CODE_BLOCK_LANGUAGES: NonNullable<CodeBlockOptions["supportedLanguages"]> = {
  text: {
    name: "Plain Text",
    aliases: ["txt", "plaintext", "none"],
  },
  bash: {
    name: "Bash",
    aliases: ["sh", "shell", "zsh"],
  },
  javascript: {
    name: "JavaScript",
    aliases: ["js", "mjs", "cjs"],
  },
  typescript: {
    name: "TypeScript",
    aliases: ["ts", "mts", "cts"],
  },
  jsx: {
    name: "JSX",
  },
  tsx: {
    name: "TSX",
  },
  json: {
    name: "JSON",
  },
  yaml: {
    name: "YAML",
    aliases: ["yml"],
  },
  toml: {
    name: "TOML",
  },
  html: {
    name: "HTML",
  },
  css: {
    name: "CSS",
  },
  scss: {
    name: "SCSS",
  },
  markdown: {
    name: "Markdown",
    aliases: ["md"],
  },
  sql: {
    name: "SQL",
  },
  python: {
    name: "Python",
    aliases: ["py"],
  },
  go: {
    name: "Go",
  },
  rust: {
    name: "Rust",
    aliases: ["rs"],
  },
  java: {
    name: "Java",
  },
  kotlin: {
    name: "Kotlin",
    aliases: ["kt", "kts"],
  },
  swift: {
    name: "Swift",
  },
  c: {
    name: "C",
  },
  cpp: {
    name: "C++",
    aliases: ["cc", "cxx", "hpp"],
  },
  csharp: {
    name: "C#",
    aliases: ["cs"],
  },
  php: {
    name: "PHP",
  },
  ruby: {
    name: "Ruby",
    aliases: ["rb"],
  },
  dockerfile: {
    name: "Dockerfile",
    aliases: ["docker"],
  },
}

const baseCodeBlockSpec = createCodeBlockSpec({
  defaultLanguage: "typescript",
  supportedLanguages: CODE_BLOCK_LANGUAGES,
  createHighlighter: getHighlighter,
})

const codeBlockSpec: typeof baseCodeBlockSpec = {
  ...baseCodeBlockSpec,
  implementation: {
    ...baseCodeBlockSpec.implementation,
    render(block, editor) {
      const rendered = baseCodeBlockSpec.implementation.render.call(this, block, editor)
      const languageContainer = rendered.dom.firstChild
      if (languageContainer instanceof HTMLElement) {
        languageContainer.classList.add("bn-editor-code-language-container")
      }

      const codeShell = document.createElement("div")
      codeShell.className = "bn-editor-code-shell"
      codeShell.append(rendered.dom)

      const copyContainer = document.createElement("div")
      copyContainer.className = "bn-editor-code-copy-container"
      copyContainer.contentEditable = "false"

      const copyButton = document.createElement("button")
      copyButton.type = "button"
      copyButton.className = "bn-editor-code-copy-button"
      copyButton.setAttribute("aria-label", "Copy code")
      copyButton.setAttribute("title", "Copy code")
      copyButton.innerHTML = `
        <span class="icon-copy">${COPY_ICON}</span>
        <span class="icon-copied">${COPIED_ICON}</span>
      `

      let resetTimer: ReturnType<typeof setTimeout> | null = null

      const resetCopyButtonState = () => {
        copyButton.classList.remove("is-copied", "is-error")
        copyButton.setAttribute("aria-label", "Copy code")
        copyButton.setAttribute("title", "Copy code")
      }

      const handleCopyClick = async (event: Event) => {
        event.preventDefault()
        event.stopPropagation()

        const codeText = rendered.contentDOM?.textContent ?? ""
        if (!codeText.trim()) return

        const isCopied = await copyText(codeText)
        copyButton.classList.remove("is-copied", "is-error")
        copyButton.classList.add(isCopied ? "is-copied" : "is-error")
        copyButton.setAttribute("aria-label", isCopied ? "Copied" : "Copy failed")
        copyButton.setAttribute("title", isCopied ? "Copied" : "Copy failed")

        if (resetTimer) {
          clearTimeout(resetTimer)
        }

        const resetDelay = isCopied ? 1400 : 1800
        resetTimer = setTimeout(() => {
          resetCopyButtonState()
          resetTimer = null
        }, resetDelay)
      }

      copyButton.addEventListener("click", handleCopyClick)
      copyContainer.append(copyButton)
      codeShell.append(copyContainer)

      const baseDestroy = rendered.destroy

      return {
        ...rendered,
        dom: codeShell,
        destroy: () => {
          copyButton.removeEventListener("click", handleCopyClick)
          if (resetTimer) {
            clearTimeout(resetTimer)
            resetTimer = null
          }
          baseDestroy?.()
        },
      }
    },
  },
}

const inlineMathSpec = createInlineContentSpec(
  {
    type: "inlineMath" as const,
    content: "none",
    propSchema: {
      latex: {
        default: "",
      },
    },
  },
  {
    render(inlineContent, updateInlineContent, editor) {
      let currentLatex = inlineContent.props.latex || ""

      const dom = document.createElement("span")
      dom.className = "bn-editor-inline-math"
      dom.contentEditable = "false"
      dom.setAttribute("role", "button")
      dom.setAttribute("tabindex", "0")
      dom.setAttribute("aria-label", "Edit inline math")
      dom.setAttribute("data-inline-content-type", "inlineMath")

      const renderedMath = document.createElement("span")
      renderedMath.className = "bn-editor-inline-math-render"
      renderedMath.innerHTML = renderMathHtml(currentLatex, false)
      dom.append(renderedMath)

      if (!editor.isEditable) {
        return { dom }
      }

      const updateRenderedMath = (latex: string) => {
        currentLatex = latex
        renderedMath.innerHTML = renderMathHtml(latex, false)
      }

      const popover = createMathPopover({
        anchor: dom,
        initialLatex: currentLatex,
        ariaLabel: "Inline equation",
        onSave: (latex) => {
          updateInlineContent({
            type: "inlineMath",
            props: {
              latex,
            },
          })
          updateRenderedMath(latex)
        },
      })

      const openPopover = (event: Event) => {
        event.preventDefault()
        event.stopPropagation()
        popover.open(currentLatex)
      }

      const handleKeyboardOpen = (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return
        }
        openPopover(event)
      }

      dom.addEventListener("click", openPopover)
      dom.addEventListener("keydown", handleKeyboardOpen)

      return {
        dom,
        destroy: () => {
          dom.removeEventListener("click", openPopover)
          dom.removeEventListener("keydown", handleKeyboardOpen)
          popover.destroy()
        },
      }
    },
    toExternalHTML(inlineContent) {
      const dom = document.createElement("span")
      const latex = inlineContent.props.latex || ""

      dom.className = "math-inline"
      dom.setAttribute("data-inline-content-type", "inlineMath")
      if (latex) {
        dom.setAttribute("data-latex", latex)
      }
      dom.innerHTML = renderMathHtml(latex, false)

      return { dom }
    },
  },
)

const createMathBlockConfig = createBlockConfig(
  () =>
    ({
      type: "mathBlock" as const,
      propSchema: {
        latex: {
          default: "",
        },
      },
      content: "none",
    }) as const,
)

const mathBlockSpec = createBlockSpec(createMathBlockConfig, {
  render(block, editor) {
    let currentLatex = block.props.latex || ""

    const dom = document.createElement("div")
    dom.className = "bn-editor-math-block"
    dom.contentEditable = "false"
    dom.setAttribute("role", "button")
    dom.setAttribute("tabindex", "0")
    dom.setAttribute("aria-label", "Edit math block")
    dom.setAttribute("data-content-type", "mathBlock")

    const renderedMath = document.createElement("div")
    renderedMath.className = "bn-editor-math-block-render"
    renderedMath.innerHTML = renderMathHtml(currentLatex, true)
    dom.append(renderedMath)

    if (!editor.isEditable) {
      return { dom }
    }

    const affordance = document.createElement("div")
    affordance.className = "bn-editor-math-block-affordance"
    affordance.textContent = currentLatex.trim() ? "Click to edit equation" : "Click to add equation"
    dom.append(affordance)

    const updateRenderedMath = (latex: string) => {
      currentLatex = latex
      renderedMath.innerHTML = renderMathHtml(latex, true)
      affordance.textContent = latex.trim() ? "Click to edit equation" : "Click to add equation"
    }

    const popover = createMathPopover({
      anchor: dom,
      initialLatex: currentLatex,
      ariaLabel: "Display equation",
      onSave: (latex) => {
        editor.updateBlock(block.id, {
          props: {
            latex,
          },
        } as any)
        updateRenderedMath(latex)
      },
    })

    const openPopover = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      popover.open(currentLatex)
    }

    const handleKeyboardOpen = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return
      }
      openPopover(event)
    }

    dom.addEventListener("click", openPopover)
    dom.addEventListener("keydown", handleKeyboardOpen)

    return {
      dom,
      destroy: () => {
        dom.removeEventListener("click", openPopover)
        dom.removeEventListener("keydown", handleKeyboardOpen)
        popover.destroy()
      },
    }
  },
  toExternalHTML(block) {
    const dom = document.createElement("div")
    dom.className = "math-block"
    const latex = block.props.latex || ""
    dom.setAttribute("data-content-type", "mathBlock")
    if (latex) {
      dom.setAttribute("data-latex", latex)
    }
    dom.innerHTML = renderMathHtml(latex, true)
    return { dom }
  },
})()

const quoteSpecFromDefaults = defaultBlockSpecs.quote as any
const quoteBlockSpec = (
  typeof quoteSpecFromDefaults === "function"
    ? quoteSpecFromDefaults()
    : quoteSpecFromDefaults
) as any
const quoteBlockSpecWithSoftBreak = {
  ...quoteBlockSpec,
  implementation: {
    ...quoteBlockSpec.implementation,
    meta: {
      ...quoteBlockSpec.implementation.meta,
      hardBreakShortcut: "enter",
    },
  },
}

export const blockNoteSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeBlock: codeBlockSpec,
    mathBlock: mathBlockSpec,
    quote: quoteBlockSpecWithSoftBreak,
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    inlineMath: inlineMathSpec,
  },
})
