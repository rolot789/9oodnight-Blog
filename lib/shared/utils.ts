import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripMarkdown(markdown: string): string {
  if (!markdown) return ""

  return markdown
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove images
    .replace(/!\[(.*?)\]\(.*?\)/g, "")
    // Remove links but keep text
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    // Remove headers (e.g., # Header)
    .replace(/^#+\s+/gm, "")
    // Remove bold and italic
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    // Remove italic
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove blockquotes
    .replace(/^\s*>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^-{3,}|^\*{3,}|^_{3,}/gm, "")
    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, "")
    // Remove numbered list markers
    .replace(/^\s*\d+\.\s+/gm, "")
    // Replace multiple newlines with a single space
    .replace(/\n+/g, " ")
    // Trim whitespace
    .trim()
}
