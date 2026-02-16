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
