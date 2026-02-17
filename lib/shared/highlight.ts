import { createHighlighter } from "shiki"

const CODE_THEME = "github-light-default"

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [CODE_THEME],
      langs: [],
    })
  }
  return highlighterPromise
}

export { CODE_THEME }
