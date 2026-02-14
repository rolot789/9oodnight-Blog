"use client"

import { useEffect, useState } from "react"

interface TocItem {
  id: string
  text: string
  level: number
}

const HEADING_SELECTORS = [
  ".post-content h1[id]",
  ".post-content h2[id]",
  ".post-content h3[id]",
  ".blocknote-viewer-wrapper [data-content-type='heading'][id]",
  "[data-content-type='heading'][id]",
].join(", ")

function parseHeadingLevel(element: Element): number {
  const headingTagMatch = element.tagName.match(/^H([1-3])$/)
  if (headingTagMatch) {
    return Number(headingTagMatch[1])
  }

  const dataLevel = Number(element.getAttribute("data-level") ?? "")
  if ([1, 2, 3].includes(dataLevel)) {
    return dataLevel
  }

  return 2
}

function collectHeadings(): TocItem[] {
  const seenIds = new Set<string>()

  return Array.from(document.querySelectorAll<HTMLElement>(HEADING_SELECTORS))
    .map((element) => ({
      id: element.id,
      text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
      level: parseHeadingLevel(element),
    }))
    .filter((item) => {
      if (!item.id || !item.text || seenIds.has(item.id)) {
        return false
      }
      seenIds.add(item.id)
      return true
    })
}

function isSameHeadingList(current: TocItem[], next: TocItem[]): boolean {
  if (current.length !== next.length) {
    return false
  }

  return current.every((item, index) => {
    const nextItem = next[index]
    return (
      item.id === nextItem.id &&
      item.text === nextItem.text &&
      item.level === nextItem.level
    )
  })
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    let intersectionObserver: IntersectionObserver | null = null
    let rafId: number | null = null

    const disconnectIntersectionObserver = () => {
      if (intersectionObserver) {
        intersectionObserver.disconnect()
        intersectionObserver = null
      }
    }

    const refreshIntersectionTargets = (items: TocItem[]) => {
      disconnectIntersectionObserver()

      if (items.length === 0) {
        return
      }

      const localObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

          if (visible.length > 0) {
            setActiveId(visible[0].target.id)
          }
        },
        { rootMargin: "-12% 0px -72% 0px", threshold: [0, 1] }
      )

      items.forEach((item) => {
        const elem = document.getElementById(item.id)
        if (elem) {
          localObserver.observe(elem)
        }
      })

      intersectionObserver = localObserver
    }

    const refreshHeadings = () => {
      const items = collectHeadings()
      setHeadings((current) => (isSameHeadingList(current, items) ? current : items))
      refreshIntersectionTargets(items)
      if (items.length > 0) {
        setActiveId((current) => current || items[0].id)
      }
    }

    const scheduleRefresh = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      rafId = requestAnimationFrame(() => {
        refreshHeadings()
      })
    }

    const mutationObserver = new MutationObserver(() => {
      scheduleRefresh()
    })

    const onHashChange = () => {
      const rawHash = decodeURIComponent(window.location.hash.replace("#", ""))
      if (rawHash) {
        setActiveId(rawHash)
      }
    }

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["id", "data-level", "data-content-type"],
    })

    scheduleRefresh()
    const timeoutId = window.setTimeout(scheduleRefresh, 900)
    window.addEventListener("hashchange", onHashChange)
    onHashChange()

    return () => {
      clearTimeout(timeoutId)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      mutationObserver.disconnect()
      disconnectIntersectionObserver()
      window.removeEventListener("hashchange", onHashChange)
    }
  }, [])

  if (headings.length === 0) return null

  return (
    <nav className="h-fit w-full">
      <h4 className="mb-4 text-xs font-bold tracking-widest text-[#080f18]">ON THIS PAGE</h4>
      <ul className="space-y-3 text-xs">
        {headings.map((heading) => (
          <li key={heading.id} className={`${heading.level === 3 ? "pl-4" : ""}`}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault()
                const target = document.getElementById(heading.id)
                if (!target) {
                  return
                }
                const headerOffset = 96
                const top = target.getBoundingClientRect().top + window.scrollY - headerOffset
                window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
                setActiveId(heading.id)
                history.replaceState(null, "", `#${encodeURIComponent(heading.id)}`)
              }}
              className={`block transition-colors border-l-2 pl-4 py-0.5 hover:text-[#080f18] ${
                activeId === heading.id
                  ? "border-[#080f18] font-medium text-[#080f18]"
                  : "border-transparent text-[#8b8c89]"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
