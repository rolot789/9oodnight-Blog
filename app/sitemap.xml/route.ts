import { siteConfig } from "@/lib/seo"
import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/types"
import { CATEGORIES } from "@/lib/constants"

export async function GET() {
  const supabase = await createClient()
  
  const { data: posts } = await supabase
    .from("posts")
    .select("id, updated_at")
    .order("updated_at", { ascending: false })

  const blogPosts = (posts as Pick<Post, "id" | "updated_at">[]) || []

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 홈페이지 -->
  <url>
    <loc>${siteConfig.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 카테고리 페이지 -->
  ${CATEGORIES.filter(cat => cat !== "Draft").map((category) => `
  <url>
    <loc>${siteConfig.url}/?category=${encodeURIComponent(category)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("")}
  
  <!-- 검색 페이지 -->
  <url>
    <loc>${siteConfig.url}/search</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- 블로그 포스트 -->
  ${blogPosts.map((post) => `
  <url>
    <loc>${siteConfig.url}/post/${post.id}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join("")}
</urlset>`

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}
