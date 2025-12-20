import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans } from "next/font/google"
import "./globals.css"
import "katex/dist/katex.min.css";

const fontSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "My Portfolio | Developer & Mathematician",
  description:
    "Exploring the intersection of Mathematics and Code. A personal blog about algorithms, mathematical theory, and software development.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={fontSans.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
