"use client"

import { useEffect, useRef } from "react"

interface PostHtmlClientProps {
  html: string
}

const COPY_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="9" y="9" width="13" height="13" rx="2"></rect>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>
`

const COPIED_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M20 6 9 17l-5-5"></path>
</svg>
`

function copyWithFallback(text: string): boolean {
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "-1000px"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()

  let copied = false
  try {
    copied = document.execCommand("copy")
  } catch {
    copied = false
  } finally {
    document.body.removeChild(textarea)
  }

  return copied
}

async function copyText(text: string): Promise<boolean> {
  if (!text) return false

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return copyWithFallback(text)
    }
  }

  return copyWithFallback(text)
}

export default function PostHtmlClient({ html }: PostHtmlClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const preBlocks = Array.from(container.querySelectorAll<HTMLPreElement>("pre"))
    for (const pre of preBlocks) {
      if (pre.parentElement?.classList.contains("code-block-shell")) {
        continue
      }

      const wrapper = document.createElement("div")
      wrapper.className = "code-block-shell"
      pre.parentNode?.insertBefore(wrapper, pre)
      wrapper.appendChild(pre)

      const button = document.createElement("button")
      button.type = "button"
      button.className = "code-copy-button"
      button.setAttribute("aria-label", "Copy code")
      button.setAttribute("title", "Copy code")
      button.innerHTML = `
        <span class="icon-copy">${COPY_ICON}</span>
        <span class="icon-copied">${COPIED_ICON}</span>
      `
      wrapper.appendChild(button)
    }

    const resetTimers = new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>()

    const resetButtonState = (button: HTMLButtonElement) => {
      button.classList.remove("is-copied", "is-error")
      button.setAttribute("aria-label", "Copy code")
      button.setAttribute("title", "Copy code")
    }

    const handleCopyClick = async (event: Event) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest<HTMLButtonElement>(".code-copy-button")
      if (!button || !container.contains(button)) return

      const pre = button.parentElement?.querySelector<HTMLPreElement>("pre")
      const codeText = pre?.querySelector("code")?.textContent ?? pre?.textContent ?? ""
      if (!codeText.trim()) return

      const isCopied = await copyText(codeText)
      button.classList.remove("is-copied", "is-error")
      button.classList.add(isCopied ? "is-copied" : "is-error")
      button.setAttribute("aria-label", isCopied ? "Copied" : "Copy failed")
      button.setAttribute("title", isCopied ? "Copied" : "Copy failed")

      const existingTimer = resetTimers.get(button)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const resetDelay = isCopied ? 1400 : 1800
      const timer = setTimeout(() => {
        resetButtonState(button)
        resetTimers.delete(button)
      }, resetDelay)
      resetTimers.set(button, timer)
    }

    container.addEventListener("click", handleCopyClick)

    return () => {
      container.removeEventListener("click", handleCopyClick)
      for (const timer of resetTimers.values()) {
        clearTimeout(timer)
      }
      resetTimers.clear()
    }
  }, [html])

  return (
    <div
      ref={containerRef}
      className="post-content prose prose-sm md:prose-base max-w-none text-[#080f18]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
