import BlockNoteViewerClient from "@/components/BlockNoteViewerClient"
import { sanitizeHtmlContent } from "@/lib/shared/security"
import { isBlockNoteJson, isHtmlContent, isBlockNoteHtml } from "@/lib/shared/content"
import PostHtmlClient from "./PostHtmlClient"
import { postHtmlStyles } from "./post-content-styles"
import MarkdownRenderer from "./MarkdownRenderer"
import { applyCodeHighlighting, addHeadingIds } from "@/features/post/lib/code-highlighting"

interface PostContentProps {
  content: string
}

export default async function PostContent({ content }: PostContentProps) {
  if (!content) {
    return null
  }

  if (isBlockNoteJson(content)) {
    return <BlockNoteViewerClient content={content} />
  }

  if (!isHtmlContent(content)) {
    return <MarkdownRenderer content={content} />
  }

  const safeHtml = sanitizeHtmlContent(content)

  if (isBlockNoteHtml(safeHtml)) {
    return <BlockNoteViewerClient content={safeHtml} />
  }

  const htmlWithHeadingIds = addHeadingIds(safeHtml)
  const highlightedHtml = await applyCodeHighlighting(htmlWithHeadingIds)

  return (
    <>
      <style>{postHtmlStyles}</style>
      <PostHtmlClient html={highlightedHtml} />
    </>
  )
}
