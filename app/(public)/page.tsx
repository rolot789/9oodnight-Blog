import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { getHomePageData } from "@/features/post/server/home"
import CreateFromMarkdownDialog from "@/components/create/CreateFromMarkdownDialog"
import ExcerptRenderer from "@/features/post/components/ExcerptRenderer"
import { toPostPath } from "@/lib/shared/slug"
import { FILTER_CATEGORIES } from "@/lib/constants"
import SiteFooter from "@/components/layout/SiteFooter"

interface PageProps {
  searchParams: Promise<{
    category?: string
    tag?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { category, tag } = await searchParams
  const selectedCategory = category || "All"
  const selectedTag = tag || null

  const { user, blogPosts, allTags } = await getHomePageData({
    selectedCategory,
    selectedTag,
  })

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Hero */}
      <section className="w-full bg-white py-8 border-b border-[#e5e5e5]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative h-[250px] w-full overflow-hidden bg-[#f8f9fa]">
            <img
              src="/banner.jpg"
              alt="Developer workspace"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg font-light tracking-wide text-[#8b8c89]">
              Exploring the intersection of Mathematics and Code
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[200px_1fr]">
          
          {/* Left Sidebar: Categories & Tags */}
          <aside className="space-y-8">
            <div>
              <h3 className="mb-6 text-xs font-bold tracking-widest text-[#080f18]">CATEGORIES</h3>
              <ul className="space-y-4">
                {FILTER_CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={cat === "All" ? "/" : `/?category=${encodeURIComponent(cat)}`}
                      className={`text-xs tracking-wider transition-colors hover:text-[#080f18] ${
                        selectedCategory === cat && !selectedTag ? "font-medium text-[#080f18] border-l-2 border-[#080f18] pl-3 -ml-3.5" : "text-[#8b8c89]"
                      }`}
                    >
                      {cat.toUpperCase()}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags Section */}
            {allTags.length > 0 && (
              <div>
                <h3 className="mb-6 text-xs font-bold tracking-widest text-[#080f18]">TAGS</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((t) => (
                    <Link
                      key={t}
                      href={`/?tag=${encodeURIComponent(t)}`}
                      className={`px-2 py-1 text-[10px] tracking-wider transition-colors border rounded ${
                        selectedTag === t
                          ? "bg-[#080f18] text-white border-[#080f18]"
                          : "bg-white text-[#8b8c89] border-[#e5e5e5] hover:border-[#080f18] hover:text-[#080f18]"
                      }`}
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
                {selectedTag && (
                  <Link
                    href="/"
                    className="mt-4 inline-block text-[10px] text-[#8b8c89] hover:text-[#080f18] underline"
                  >
                    Clear tag filter
                  </Link>
                )}
              </div>
            )}
          </aside>

          {/* Right Column: Content */}
          <main className="min-w-0"> {/* min-w-0 prevents overflow issues in grid */}
            
            {/* Admin Actions */}
            {user && (
              <div className="mb-10 flex justify-end">
                <CreateFromMarkdownDialog
                  label="CREATE"
                  showPlusIcon
                  className="flex items-center gap-2 border border-[#080f18] bg-transparent px-6 py-3 text-xs tracking-wider text-[#080f18] transition-all hover:text-[#6096ba] hover:border-[#6096ba]"
                />
              </div>
            )}

            {/* Blog Posts List */}
            <div className="space-y-8">
              {blogPosts.map((post) => {
                const postPath = toPostPath(post.slug || post.id)

                return (
                  <article key={post.id} className="flex flex-col gap-6 bg-white p-6 shadow-sm md:flex-row transition-shadow hover:shadow-md">
                  <div className="relative h-[220px] w-full flex-shrink-0 overflow-hidden md:h-auto md:min-h-[180px] md:w-[260px]">
                    <Link href={postPath} className="absolute inset-0 h-full w-full">
                      <img
                        src={post.image_url || "/placeholder.svg?height=200&width=280&query=abstract"}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </Link>
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="border border-[#6096ba] px-2 py-0.5 text-[10px] font-normal tracking-wider text-[#6096ba]">
                          {post.category}
                        </span>
                        {post.tags && post.tags.map((t) => (
                          <Link key={t} href={`/?tag=${encodeURIComponent(t)}`}>
                            <Badge variant="secondary" className="text-[10px] font-normal tracking-wider cursor-pointer hover:bg-[#080f18] hover:text-white transition-colors">
                              {t}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                      <Link href={postPath} className="block group">
                        <h2 className="mb-3 text-lg font-light tracking-wide text-[#080f18] transition-colors group-hover:text-[#6096ba]">{post.title.toUpperCase()}</h2>
                        <ExcerptRenderer
                          content={post.excerpt || ""}
                          variant="card"
                          className="line-clamp-3"
                        />
                      </Link>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#e5e5e5] pt-4">
                      <div className="flex items-center gap-4 text-[11px] text-[#8b8c89]">
                        <span>Admin</span>
                        <span>
                          {new Date(post.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>{post.read_time} read</span>
                      </div>
                      {user && (
                        <div className="flex gap-3">
                          <Link
                            href={`/edit?id=${post.id}`}
                            className="text-xs tracking-wider text-[#6096ba] transition-colors hover:text-[#4a7a9a]"
                          >
                            Edit
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                    </article>
                  )
              })}
              {blogPosts.length === 0 && (
                <div className="py-20 text-center border border-dashed border-[#e5e5e5]">
                  <p className="text-sm text-[#8b8c89] mb-2">No posts found in {selectedCategory}.</p>
                  {user && (
                    <CreateFromMarkdownDialog
                      label="Create one now"
                      className="text-xs text-[#6096ba] underline"
                    />
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* View All Posts Button */}
      {blogPosts.length > 0 && selectedCategory !== "All" && (
        <div className="flex justify-center mt-12 px-6">
          <Link
            href="/"
            className="border border-[#080f18] bg-[#080f18] px-8 py-3 text-xs tracking-wider text-white transition-colors hover:bg-white hover:text-[#080f18]"
          >
            VIEW ALL POSTS
          </Link>
        </div>
      )}

      <SiteFooter brandText="9oodnight" maxWidth="max-w-6xl" />
    </div>
  )
}
