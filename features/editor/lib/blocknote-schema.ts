import { BlockNoteSchema, createCodeBlockSpec, defaultBlockSpecs } from "@blocknote/core"
import type { CodeBlockOptions } from "@blocknote/core"
import { createHighlighter } from "shiki"

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

let codeHighlighterPromise: ReturnType<typeof createHighlighter> | null = null

function getCodeHighlighter() {
  if (!codeHighlighterPromise) {
    codeHighlighterPromise = createHighlighter({
      themes: ["github-light-default"],
      langs: [],
    })
  }

  return codeHighlighterPromise
}

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

const baseCodeBlockSpec = createCodeBlockSpec({
  defaultLanguage: "typescript",
  supportedLanguages: CODE_BLOCK_LANGUAGES,
  createHighlighter: getCodeHighlighter,
})

const codeBlockSpec: typeof baseCodeBlockSpec = {
  ...baseCodeBlockSpec,
  implementation: {
    ...baseCodeBlockSpec.implementation,
    render(block, editor) {
      const rendered = baseCodeBlockSpec.implementation.render.call(this, block, editor)
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

export const blockNoteSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeBlock: codeBlockSpec,
  },
})
