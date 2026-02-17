import { getHighlighter, CODE_THEME } from "@/lib/shared/highlight"
import { createHeadingSlug } from "@/lib/shared/slug"

const CODE_BLOCK_PATTERN = /<pre([^>]*)>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2f;/gi, "/")
}

function normalizeLanguage(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_+-]/g, "")
}

function extractCodeLanguage(attrs: string): string {
  const dataLanguageMatch = attrs.match(/data-language\s*=\s*['"]([^'"]+)['"]/i)
  if (dataLanguageMatch?.[1]) {
    return normalizeLanguage(dataLanguageMatch[1])
  }

  const classLanguageMatch = attrs.match(/class\s*=\s*['"][^'"]*language-([a-z0-9_+-]+)/i)
  if (classLanguageMatch?.[1]) {
    return normalizeLanguage(classLanguageMatch[1])
  }

  return "text"
}

async function renderHighlightedCode(code: string, requestedLanguage: string): Promise<string> {
  const highlighter = await getHighlighter()
  let language = requestedLanguage || "text"

  try {
    if (language !== "text" && !highlighter.getLoadedLanguages().includes(language as any)) {
      await highlighter.loadLanguage(language as any)
    }
  } catch {
    language = "text"
  }

  try {
    return highlighter.codeToHtml(code, {
      lang: language as any,
      theme: CODE_THEME,
    })
  } catch {
    return highlighter.codeToHtml(code, {
      lang: "text",
      theme: CODE_THEME,
    })
  }
}

export async function applyCodeHighlighting(html: string): Promise<string> {
  const matches = Array.from(html.matchAll(CODE_BLOCK_PATTERN))
  if (matches.length === 0) {
    return html
  }

  let highlightedHtml = ""
  let lastIndex = 0

  for (const match of matches) {
    const [fullMatch, preAttrs = "", codeAttrs = "", codeInner = ""] = match
    const start = match.index ?? 0

    highlightedHtml += html.slice(lastIndex, start)

    const language = extractCodeLanguage(`${preAttrs} ${codeAttrs}`)
    const plainCode = decodeHtmlEntities(
      codeInner
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/?[^>]+>/g, "")
    )

    highlightedHtml += await renderHighlightedCode(plainCode, language)
    lastIndex = start + fullMatch.length
  }

  highlightedHtml += html.slice(lastIndex)
  return highlightedHtml
}

export function addHeadingIds(html: string): string {
  const slugCounter = new Map<string, number>()
  let headingIndex = 0

  return html.replace(
    /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (fullMatch, level, attrs, innerHtml) => {
      if (/\sid\s*=\s*(['"]).+?\1/i.test(attrs)) {
        return fullMatch
      }

      const plainText = innerHtml
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z0-9#]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
      const baseSlug = createHeadingSlug(plainText, headingIndex)
      headingIndex += 1

      const nextCount = (slugCounter.get(baseSlug) ?? 0) + 1
      slugCounter.set(baseSlug, nextCount)

      const slug = nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`
      return `<h${level}${attrs} id="${slug}">${innerHtml}</h${level}>`
    }
  )
}
