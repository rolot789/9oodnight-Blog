import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/types"
import Link from "next/link"
import LogoutButton from "@/components/LogoutButton"

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: posts } = await supabase.from("posts").select("*").order("created_at", { ascending: false })

  const blogPosts = (posts as Post[]) || []

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <header className="w-full border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="text-sm font-light tracking-[0.3em] text-[#080f18]">
            MY PORTFOLIO
          </a>
          <nav className="flex items-center gap-8">
            <a href="/" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
              HOME
            </a>
            <a href="/dev" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
              DEV
            </a>
            <a href="/math" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
              MATH
            </a>
            <a href="/about" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
              ABOUT
            </a>
            {session ? (
              <LogoutButton />
            ) : (
              <Link href="/login" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
                LOGIN
              </Link>
            )}
          </nav>
        </div>
      </header>


      {/* Hero */}
      <section className="w-full bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative h-[300px] w-full overflow-hidden">
            <img
              src="/minimal-workspace-with-laptop-and-mathematical-equ.jpg"
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

      {/* Blog Posts */}
      <section className="w-full py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="flex flex-col gap-6 bg-white p-6 shadow-sm md:flex-row">
                <div className="relative h-[220px] w-full flex-shrink-0 overflow-hidden md:h-[200px] md:w-[280px]">
                  <img
                    src={post.image_url || "/placeholder.svg?height=200&width=280&query=abstract"}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="border border-[#6096ba] px-2 py-0.5 text-[10px] font-normal tracking-wider text-[#6096ba]">
                        {post.category}
                      </span>
                    </div>
                    <h2 className="mb-3 text-lg font-light tracking-wide text-[#080f18]">{post.title.toUpperCase()}</h2>
                    <p className="text-sm leading-relaxed text-[#8b8c89]">{post.excerpt}</p>
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
                    {session ? (
                      <Link
                        href={`/edit?id=${post.id}`}
                        className="text-xs tracking-wider text-[#6096ba] transition-colors hover:text-[#4a7a9a]"
                      >
                        Edit
                      </Link>
                    ) : (
                      <a
                        href={`/post?id=${post.id}`}
                        className="text-xs tracking-wider text-[#6096ba] transition-colors hover:text-[#4a7a9a]"
                      >
                        Read More
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {blogPosts.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-[#8b8c89]">No posts yet. Create your first post!</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#080f18] py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm font-light tracking-[0.3em] text-white">MY PORTFOLIO</p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com"
                className="text-[#8b8c89] transition-colors hover:text-white"
                aria-label="GitHub"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                className="text-[#8b8c89] transition-colors hover:text-white"
                aria-label="LinkedIn"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="mailto:hello@example.com"
                className="text-[#8b8c89] transition-colors hover:text-white"
                aria-label="Email"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </a>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-[#8b8c89]">© 2025 My Portfolio. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
