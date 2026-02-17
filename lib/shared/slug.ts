export function toSlug(input: string): string {
  return input
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function toPostPath(identifier: string): string {
  return `/post/${encodeURIComponent(identifier)}`
}

export function toPostUrl(siteUrl: string, identifier: string): string {
  return `${siteUrl}${toPostPath(identifier)}`
}

export function createHeadingSlug(text: string, index: number): string {
  const slug = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return slug || `section-${index + 1}`
}
