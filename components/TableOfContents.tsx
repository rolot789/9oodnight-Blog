"use client"

import { useEffect, useState } from "react"

interface TocItem {
  id: string
  text: string
  level: number
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    // Wait for BlockNote content to render and heading IDs to be added
    const timeoutId = setTimeout(() => {
      // Find BlockNote headings with data-content-type="heading"
      const selectors = "[data-content-type='heading'][id]"

      const seenIds = new Set<string>()
      const elements = Array.from(document.querySelectorAll(selectors))
        .map((elem) => {
          // Get level from data-level attribute or tag name
          let level = 2 // default
          if (elem.getAttribute('data-level')) {
            level = Number(elem.getAttribute('data-level'))
          } else if (elem.tagName.match(/^H[1-3]$/)) {
            level = Number(elem.tagName.substring(1))
          }
          return {
            id: elem.id,
            text: elem.textContent || "",
            level: level,
          }
        })
        .filter((item) => {
          // Filter items with IDs and text, and deduplicate
          if (!item.id || !item.text || seenIds.has(item.id)) {
            return false
          }
          seenIds.add(item.id)
          return true
        })

      setHeadings(elements)

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id)
            }
          })
        },
        { rootMargin: "-10% 0px -80% 0px" } // Adjust trigger area
      )

      elements.forEach((item) => {
        const elem = document.getElementById(item.id)
        if (elem) observer.observe(elem)
      })

      return () => observer.disconnect()
    }, 500) // Longer delay to ensure BlockNote content is fully rendered

    return () => clearTimeout(timeoutId)
  }, []) // Empty dependency array means this runs once on mount

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
                document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" })
                setActiveId(heading.id)
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
