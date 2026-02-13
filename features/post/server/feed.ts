import { siteConfig } from "@/lib/seo"
import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/types"

export async function generateFeedXml(): Promise<string> {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  const blogPosts = (posts as Post[]) || []

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteConfig.url}/logo.png</url>
      <title>${escapeXml(siteConfig.name)}</title>
      <link>${siteConfig.url}</link>
    </image>
    ${blogPosts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteConfig.url}/post/${post.id}</link>
      <guid isPermaLink="true">${siteConfig.url}/post/${post.id}</guid>
      <description>${escapeXml(post.excerpt || "")}</description>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      ${post.image_url ? `<enclosure url="${post.image_url}" type="image/jpeg"/>` : ""}
    </item>`
      )
      .join("")}
  </channel>
</rss>`
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
