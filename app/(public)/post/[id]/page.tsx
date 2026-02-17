import { notFound } from "next/navigation"
import Link from "next/link"
import { headers } from "next/headers"
import { Paperclip, Download, Edit, CheckCircle2, Circle } from "lucide-react"
import TableOfContents from "@/features/post/components/TableOfContents"
import { Badge } from "@/components/ui/badge"
import PostContent from "@/features/post/components/PostContent"
import RelatedPosts from "@/features/post/components/RelatedPosts"
import SeriesNavigator from "@/features/post/components/SeriesNavigator"
import ExcerptRenderer from "@/features/post/components/ExcerptRenderer"
import { generatePostMetadata, generateArticleJsonLd, generateBreadcrumbJsonLd, siteConfig } from "@/lib/seo"
import type { Metadata } from "next"
import { toPostPath } from "@/lib/shared/slug"
import { getPostByIdentifier, getPostPageData } from "@/features/post/server/post"
import { serializeJsonLd } from "@/lib/shared/security"
import { STATUS_LABELS } from "@/lib/constants"
import SiteFooter from "@/components/layout/SiteFooter"
import AuthorCard from "@/components/layout/AuthorCard"

interface PostPageProps {
  params: Promise<{
    id: string
  }>
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id: identifier } = await params
  const post = await getPostByIdentifier(identifier)

  if (!post) {
    return {
      title: "Post Not Found",
    }
  }

  return generatePostMetadata(post)
}

export default async function PostPage({ params }: PostPageProps) {
  const { id: identifier } = await params
  const { user, post, seriesContext, linkedTodos } = await getPostPageData(identifier)
  const nonce = (await headers()).get("x-nonce") ?? undefined

  if (!post) {
    notFound()
  }

  // JSON-LD 구조화된 데이터
  const articleJsonLd = generateArticleJsonLd(post)
  const postPath = toPostPath(post.slug || post.id)
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: siteConfig.url },
    { name: post.category, url: `${siteConfig.url}/?category=${encodeURIComponent(post.category)}` },
    { name: post.title, url: `${siteConfig.url}${postPath}` },
  ])

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD 구조화된 데이터 */}
      <script
        suppressHydrationWarning
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />
      <script
        suppressHydrationWarning
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      {/* Post Content */}
      <article className="w-full py-12">
        <div className="mx-auto max-w-4xl px-6 relative">
          
          {/* Header Section (Title, Meta, Image) */}
          <div>
            <div className="mb-8 flex items-center justify-between">
              {/* Back Link */}
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>

              {/* Edit Link - Visible if logged in */}
              {user && (
                <Link
                  href={`/edit?id=${post.id}`}
                  className="inline-flex items-center gap-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]"
                >
                  <Edit className="h-3 w-3" />
                  EDIT POST
                </Link>
              )}
            </div>

            {/* Category and Tags */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="border border-[#6096ba] px-2 py-0.5 text-[10px] font-normal tracking-wider text-[#6096ba]">
                {post.category}
              </span>
              {post.tags && post.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-[10px] font-normal tracking-wider">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="mb-6 text-2xl font-light tracking-wide text-[#080f18] md:text-3xl">{post.title}</h1>

            {/* Excerpt */}
            {post.excerpt?.trim() && (
              <ExcerptRenderer
                content={post.excerpt}
                variant="view"
                className="mb-6"
              />
            )}

            {/* Meta */}
            <div className="mb-8 flex items-center gap-4 text-[11px] text-[#8b8c89]">
              <span>Admin</span>
              <span className="h-1 w-1 rounded-full bg-[#8b8c89]"></span>
              <span>
                {new Date(post.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="h-1 w-1 rounded-full bg-[#8b8c89]"></span>
              <span>{post.read_time}</span>
            </div>

            {/* Featured Image */}
            {post.image_url && post.image_url !== "/Thumbnail.jpg" && (
              <div className="relative mb-10 h-[300px] w-full overflow-hidden md:h-[400px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="text-base text-[#080f18]">
            <PostContent content={post.content} />
          </div>

          {/* Series Navigator */}
          {seriesContext && <SeriesNavigator series={seriesContext} />}

          {/* Linked Todos */}
          {linkedTodos.length > 0 && (
            <section className="mt-10">
              <h3 className="mb-4 text-sm font-bold tracking-widest text-[#080f18]">RELATED TODO</h3>
              <div className="space-y-3">
                {linkedTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between rounded border border-[#e5e5e5] bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {todo.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-[#6096ba]" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#8b8c89]" />
                      )}
                      <span
                        className={`text-sm ${todo.completed ? "text-[#8b8c89] line-through" : "text-[#080f18]"}`}
                      >
                        {todo.text}
                      </span>
                    </div>
                    <span className="text-[10px] tracking-wider text-[#8b8c89]">
                      {STATUS_LABELS[todo.status]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <Link
                  href="/todo"
                  className="text-xs tracking-wider text-[#6096ba] transition-colors hover:text-[#4a7a9e]"
                >
                  VIEW IN TODO BOARD
                </Link>
              </div>
            </section>
          )}

          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mt-12">
              <h3 className="mb-4 text-sm font-bold tracking-widest text-[#080f18]">ATTACHMENTS</h3>
              <div className="space-y-3">
                {post.attachments.map((file: { url: string, filename: string, filePath: string }, index: number) => (
                  <a
                    key={file.filePath || index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded border border-[#e5e5e5] bg-white p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-4 w-4 text-[#8b8c89]" />
                      <span className="text-sm text-[#080f18]">{file.filename}</span>
                    </div>
                    <Download className="h-4 w-4 text-[#8b8c89]" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ToC Sidebar - Fixed to left side */}
          <aside className="hidden xl:block fixed left-8 top-24 w-[240px]">
             <TableOfContents />
          </aside>

          {/* Related Posts */}
          <RelatedPosts
            currentPostId={post.id}
            tags={post.tags}
            category={post.category}
          />

          <AuthorCard />
        </div>
      </article>

      <SiteFooter />
    </div>
  )
}
