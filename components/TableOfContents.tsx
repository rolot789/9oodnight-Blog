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
    // Wait for content to render
    const timeoutId = setTimeout(() => {
      const elements = Array.from(document.querySelectorAll("article h1, article h2, article h3"))
        .map((elem) => ({
          id: elem.id,
          text: elem.textContent || "",
          level: Number(elem.tagName.substring(1)),
        }))
        .filter((item) => item.id) // Filter items with IDs

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
    }, 100) // Small delay to ensure MDX is rendered

    return () => clearTimeout(timeoutId)
  }, []) // Empty dependency array means this runs once on mount

  if (headings.length === 0) return null

  return (
    <nav className="sticky top-24 hidden h-fit w-[240px] shrink-0 xl:block ml-12">
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
