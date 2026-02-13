import { generateSitemapXml } from "@/features/post/server/sitemap"

export async function GET() {
  const sitemap = await generateSitemapXml()

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}
