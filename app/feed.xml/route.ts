import { generateFeedXml } from "@/features/post/server/feed"

export async function GET() {
  const feed = await generateFeedXml()

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
