import { CATEGORIES } from "@/lib/constants"
import { siteConfig } from "@/lib/seo"
import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/types"

export async function generateSitemapXml(): Promise<string> {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from("posts")
    .select("id, updated_at")
    .order("updated_at", { ascending: false })

  const blogPosts = (posts as Pick<Post, "id" | "updated_at">[]) || []

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteConfig.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${CATEGORIES.filter((cat) => cat !== "Draft")
    .map(
      (category) => `
  <url>
    <loc>${siteConfig.url}/?category=${encodeURIComponent(category)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("")}
  <url>
    <loc>${siteConfig.url}/search</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  ${blogPosts
    .map(
      (post) => `
  <url>
    <loc>${siteConfig.url}/post/${post.id}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("")}
</urlset>`
}
