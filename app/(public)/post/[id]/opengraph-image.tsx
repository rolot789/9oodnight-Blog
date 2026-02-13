import { ImageResponse } from "next/og"
import { getPostById } from "@/features/post/server/post"
import { siteConfig } from "@/lib/seo"

export const runtime = "edge"
export const contentType = "image/png"
export const size = {
  width: 1200,
  height: 630,
}
export const alt = "Post Open Graph Image"

interface Props {
  params: Promise<{ id: string }>
}

export default async function PostOpenGraphImage({ params }: Props) {
  const { id } = await params
  const post = await getPostById(id)

  const title = post?.title ?? "Post Not Found"
  const category = post?.category ?? "Blog"
  const excerpt = (post?.excerpt || siteConfig.description).slice(0, 140)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at 15% 20%, #31527e 0%, #1b2e4a 35%, #0a1220 100%)",
          color: "#f7fafc",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid rgba(247, 250, 252, 0.5)",
            borderRadius: 9999,
            padding: "8px 16px",
            fontSize: 20,
            letterSpacing: 2,
            maxWidth: "fit-content",
          }}
        >
          {category.toUpperCase()}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: 62,
              fontWeight: 700,
              lineHeight: 1.1,
              maxHeight: 270,
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              opacity: 0.95,
              maxWidth: 980,
              lineHeight: 1.25,
              maxHeight: 120,
              overflow: "hidden",
            }}
          >
            {excerpt}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            opacity: 0.92,
          }}
        >
          <div>{siteConfig.name}</div>
          <div>{siteConfig.author.name}</div>
        </div>
      </div>
    ),
    size
  )
}
