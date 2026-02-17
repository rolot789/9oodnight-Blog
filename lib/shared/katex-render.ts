import katex from "katex"

export const KATEX_DELIMITERS = [
  { left: "$$", right: "$$", display: true },
  { left: "$", right: "$", display: false },
] as const

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function renderMathHtml(latex: string, displayMode: boolean): string {
  const normalizedLatex = latex.trim()

  if (!normalizedLatex) {
    return `<span class="math-empty">${displayMode ? "Empty equation" : "Empty math"}</span>`
  }

  try {
    return katex.renderToString(normalizedLatex, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      output: "html",
    })
  } catch {
    return `<span class="math-fallback">${escapeHtml(normalizedLatex)}</span>`
  }
}
