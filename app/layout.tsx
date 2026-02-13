import type React from "react"
import type { Metadata, Viewport } from "next"
import { Noto_Sans } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import "katex/dist/katex.min.css"
import Header from "@/components/layout/Header"
import { defaultMetadata, generateWebsiteJsonLd, siteConfig } from "@/lib/seo"
import { serializeJsonLd } from "@/lib/shared/security"

const fontSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })

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
    <html lang="ko" className={fontSans.variable}>
      <head>
        {/* JSON-LD 구조화된 데이터 */}
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
        />
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
