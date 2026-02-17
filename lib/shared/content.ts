export function isBlockNoteJson(content: string): boolean {
  const trimmed = content.trim()
  if (!trimmed.startsWith("[")) return false
  try {
    const parsed = JSON.parse(trimmed)
    return (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === "object" &&
      "type" in parsed[0]
    )
  } catch {
    return false
  }
}

export function isHtmlContent(content: string): boolean {
  const trimmed = content.trim()
  return (
    trimmed.startsWith("<") &&
    (trimmed.startsWith("<p") ||
      trimmed.startsWith("<h") ||
      trimmed.startsWith("<div") ||
      trimmed.startsWith("<ul") ||
      trimmed.startsWith("<ol") ||
      trimmed.startsWith("<blockquote") ||
      trimmed.startsWith("<pre") ||
      trimmed.startsWith("<table"))
  )
}

export function isBlockNoteHtml(content: string): boolean {
  const trimmed = content.trim()
  return (
    trimmed.includes("data-content-type=") ||
    trimmed.includes('class="bn-') ||
    trimmed.includes("class='bn-")
  )
}
