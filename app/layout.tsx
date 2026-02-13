import type React from "react"
import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import "./globals.css"
import "katex/dist/katex.min.css"
import Header from "@/components/layout/Header"
import { defaultMetadata, generateWebsiteJsonLd, siteConfig } from "@/lib/seo"
import { serializeJsonLd } from "@/lib/shared/security"

export const metadata: Metadata = {
  ...defaultMetadata,
  generator: "Next.js",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#080f18" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const websiteJsonLd = generateWebsiteJsonLd()
  const nonce = (await headers()).get("x-nonce") ?? undefined

  return (
    <html lang="ko">
      <head>
        {/* JSON-LD 구조화된 데이터 */}
        <script
          suppressHydrationWarning
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
        />
        {/* RSS Feed */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${siteConfig.name} RSS Feed`}
          href="/feed.xml"
        />
      </head>
      <body className="antialiased">
        <Header />
        {children}
      </body>
    </html>
  )
}
