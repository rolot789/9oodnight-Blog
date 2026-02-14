import { BlockNoteSchema, createCodeBlockSpec, defaultBlockSpecs } from "@blocknote/core"
import type { CodeBlockOptions } from "@blocknote/core"
import { createHighlighter } from "shiki"

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

const codeBlockSpec = createCodeBlockSpec({
  defaultLanguage: "typescript",
  supportedLanguages: CODE_BLOCK_LANGUAGES,
  createHighlighter: getCodeHighlighter,
})

export const blockNoteSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeBlock: codeBlockSpec,
  },
})
