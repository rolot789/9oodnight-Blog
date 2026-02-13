import { ImageResponse } from "next/og"
import { siteConfig } from "@/lib/seo"

export const runtime = "edge"
export const contentType = "image/png"
export const size = {
  width: 1200,
  height: 630,
}
export const alt = siteConfig.name

export default function OpenGraphImage() {
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
            "linear-gradient(135deg, #0b1220 0%, #182338 42%, #274a72 100%)",
          color: "#f3f6fb",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid rgba(243, 246, 251, 0.45)",
            borderRadius: 9999,
            padding: "8px 16px",
            fontSize: 20,
            letterSpacing: 2,
          }}
        >
          BLOG
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>
            {siteConfig.name}
          </div>
          <div
            style={{
              fontSize: 32,
              opacity: 0.95,
              maxWidth: 980,
              lineHeight: 1.25,
            }}
          >
            {siteConfig.description}
          </div>
        </div>
      </div>
    ),
    size
  )
}
