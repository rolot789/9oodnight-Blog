import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { getRelatedPosts } from "@/features/post/server/related-posts"
import { DEFAULT_IMAGES } from "@/lib/constants"
import { toPostPath } from "@/lib/shared/slug"

interface RelatedPostsProps {
  currentPostId: string
  tags: string[] | null
  category: string
  limit?: number
}

export default async function RelatedPosts({
  currentPostId,
  tags,
  category,
  limit = 3,
}: RelatedPostsProps) {
  const relatedPosts = await getRelatedPosts({
    currentPostId,
    tags,
    category,
    limit,
  })

  if (relatedPosts.length === 0) {
    return null
  }

  const hasCustomThumbnail = relatedPosts.some(
    (post) => Boolean(post.image_url) && post.image_url !== DEFAULT_IMAGES.THUMBNAIL,
  )

  return (
    <div className="mt-12">
      <h3 className="mb-6 text-sm font-bold tracking-widest text-[#080f18]">
        RELATED POSTS
      </h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {relatedPosts.map((post) => (
          <Link
            key={post.id}
            href={toPostPath(post.slug || post.id)}
            className="group block overflow-hidden rounded border border-[#e5e5e5] bg-white transition-all hover:border-[#080f18] hover:shadow-md"
          >
            {/* Thumbnail */}
            {hasCustomThumbnail && (
              <div className="relative h-32 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image_url || DEFAULT_IMAGES.THUMBNAIL}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}

            <div className="p-4">
              {/* Category & Tags */}
              <div className="mb-2 flex flex-wrap items-center gap-1">
                <span className="border border-[#6096ba] px-1.5 py-0.5 text-[9px] font-normal tracking-wider text-[#6096ba]">
                  {post.category}
                </span>
                {post.tags?.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[9px] font-normal tracking-wider"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Title */}
              <h4 className="mb-2 text-sm font-medium text-[#080f18] line-clamp-2 transition-colors group-hover:text-[#6096ba]">
                {post.title}
              </h4>

              {/* Meta */}
              <div className="flex items-center gap-2 text-[10px] text-[#8b8c89]">
                <span>
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>·</span>
                <span>{post.read_time}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
