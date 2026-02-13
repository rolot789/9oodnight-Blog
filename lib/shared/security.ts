export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export const MAX_SEARCH_QUERY_LENGTH = 64

export function normalizeSearchQuery(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s#._-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_QUERY_LENGTH)
}

export function sanitizeHtmlContent(input: string): string {
  return input
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*(javascript|data):[\s\S]*?\2/gi, ' $1="#"')
}

export function getSafeRedirectPath(input: string | null | undefined): string {
  if (!input || !input.startsWith("/")) {
    return "/"
  }

  if (input.startsWith("//")) {
    return "/"
  }

  return input
}
