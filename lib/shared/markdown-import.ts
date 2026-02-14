import { normalizeKaTeXMarkdown } from "@/lib/shared/katex-markdown"

export const MARKDOWN_IMPORT_STORAGE_KEY = "editor:imported-markdown"
const MARKDOWN_IMPORT_SOURCE = "markdown-import-modal"
const MARKDOWN_IMPORT_VERSION = 1

export interface MarkdownPreset {
  title: string
  excerpt: string
  body: string
}

export interface MarkdownImportPayload extends MarkdownPreset {
  source: typeof MARKDOWN_IMPORT_SOURCE
  version: typeof MARKDOWN_IMPORT_VERSION
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n")
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function parseFrontmatter(input: string): {
  fields: Record<string, string>
  body: string
} {
  const normalized = normalizeLineEndings(input)
  if (!normalized.startsWith("---\n")) {
    return { fields: {}, body: normalized }
  }

  const lines = normalized.split("\n")
  let closingIndex = -1

  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      closingIndex = i
      break
    }
  }

  if (closingIndex === -1) {
    return { fields: {}, body: normalized }
  }

  const fields: Record<string, string> = {}
  const frontmatterLines = lines.slice(1, closingIndex)
  for (const line of frontmatterLines) {
    const match = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
    if (!match) continue
    const key = match[1].toLowerCase()
    const value = stripWrappingQuotes(match[2] ?? "")
    fields[key] = value
  }

  const body = lines.slice(closingIndex + 1).join("\n").replace(/^\n+/, "")
  return { fields, body }
}

function extractFirstLevelHeading(body: string): { title: string; body: string } | null {
  const lines = normalizeLineEndings(body).split("\n")
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^\s*#\s+(.+?)\s*$/)
    if (!match) continue

    const title = match[1].trim()
    const remaining = [...lines.slice(0, i), ...lines.slice(i + 1)]
    if (remaining[i]?.trim() === "") {
      remaining.splice(i, 1)
    }
    return {
      title,
      body: remaining.join("\n").replace(/^\n+/, ""),
    }
  }
  return null
}

export function parseMarkdownPreset(raw: string): MarkdownPreset {
  const { fields, body: bodyAfterFrontmatter } = parseFrontmatter(raw)

  let title = (fields.title ?? "").trim()
  const excerpt = (fields.excerpt ?? "").trim()
  let body = bodyAfterFrontmatter.trim()

  if (!title) {
    const heading = extractFirstLevelHeading(body)
    if (heading) {
      title = heading.title
      body = heading.body.trim()
    }
  }

  return { title, excerpt, body: normalizeKaTeXMarkdown(body) }
}

export function toMarkdownImportPayload(preset: MarkdownPreset): MarkdownImportPayload {
  return {
    ...preset,
    source: MARKDOWN_IMPORT_SOURCE,
    version: MARKDOWN_IMPORT_VERSION,
  }
}

export function parseMarkdownImportPayload(raw: string): MarkdownImportPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<MarkdownImportPayload>
    if (parsed?.source !== MARKDOWN_IMPORT_SOURCE) return null
    if (parsed?.version !== MARKDOWN_IMPORT_VERSION) return null
    if (typeof parsed.title !== "string") return null
    if (typeof parsed.excerpt !== "string") return null
    if (typeof parsed.body !== "string") return null
    return {
      source: MARKDOWN_IMPORT_SOURCE,
      version: MARKDOWN_IMPORT_VERSION,
      title: parsed.title,
      excerpt: parsed.excerpt,
      body: normalizeKaTeXMarkdown(parsed.body),
    }
  } catch {
    return null
  }
}
