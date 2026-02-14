function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n")
}

function isDisplayMathFence(line: string): boolean {
  const trimmed = line.trim()
  return trimmed === "$$" || trimmed === "$$\\" || trimmed === "\\$$"
}

function stripSingleTrailingBackslash(line: string): string {
  const rightTrimmed = line.replace(/\s+$/, "")
  if (!rightTrimmed.endsWith("\\")) return line
  if (rightTrimmed.endsWith("\\\\")) return line

  const removed = rightTrimmed.slice(0, -1)
  const trailingWhitespace = line.slice(rightTrimmed.length)
  return `${removed}${trailingWhitespace}`
}

export function normalizeKaTeXMarkdown(input: string): string {
  const normalized = normalizeLineEndings(input)
  const lines = normalized.split("\n")
  const result: string[] = []
  let inDisplayMath = false

  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i]

    if (isDisplayMathFence(line)) {
      result.push("$$")
      inDisplayMath = !inDisplayMath
      continue
    }

    if (inDisplayMath) {
      const nextLine = lines[i + 1]
      if (typeof nextLine === "string" && isDisplayMathFence(nextLine)) {
        line = stripSingleTrailingBackslash(line)
      }
    }

    result.push(line)
  }

  return result.join("\n")
}

export function containsKaTeXMathDelimiters(input: string): boolean {
  if (!input) return false
  if (/(^|\n)\s*\$\$[\s\S]*?\$\$\s*(?=\n|$)/m.test(input)) {
    return true
  }
  return /(^|[^\\])\$(?!\s)([^$\\]|\\.)+?\$(?!\$)/.test(input)
}
