import type { Metadata } from "next"
import type { Post } from "../types"

// 사이트 기본 설정
export const siteConfig = {
  name: "My Portfolio",
  description: "Exploring the intersection of Mathematics and Code. A personal blog about algorithms, mathematical theory, and software development.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  author: {
    name: "Admin",
    title: "Developer & Mathematician",
  },
  locale: "ko_KR",
  twitter: "@yourtwitterhandle",
}

// 기본 메타데이터
export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.author.title}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["블로그", "수학", "개발", "알고리즘", "프로그래밍", "Mathematics", "Development", "Algorithms"],
  authors: [{ name: siteConfig.author.name }],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: siteConfig.twitter,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
  },
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
}

// 포스트별 동적 메타데이터 생성
export function generatePostMetadata(post: Post): Metadata {
  const postUrl = `${siteConfig.url}/post/${post.id}`
  const ogImage = `${siteConfig.url}/post/${post.id}/opengraph-image`

  // 본문에서 요약 추출 (첫 160자)
  const description = post.excerpt || extractDescription(post.content, 160)

  return {
    title: post.title,
    description,
    keywords: [
      post.category,
      ...(post.tags || []),
    ],
    authors: [{ name: siteConfig.author.name }],
    openGraph: {
      type: "article",
      locale: siteConfig.locale,
      url: postUrl,
      siteName: siteConfig.name,
      title: post.title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: [siteConfig.author.name],
      tags: post.tags || [],
      section: post.category,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      creator: siteConfig.twitter,
      images: [ogImage],
    },
    alternates: {
      canonical: postUrl,
    },
  }
}

// JSON-LD 구조화된 데이터 생성 (Article 스키마)
export function generateArticleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || extractDescription(post.content, 160),
    image: post.image_url && post.image_url !== "/Thumbnail.jpg" 
      ? post.image_url 
      : `${siteConfig.url}/opengraph-image`,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/post/${post.id}`,
    },
    articleSection: post.category,
    keywords: post.tags?.join(", "),
  }
}

// 사이트 전체 JSON-LD (WebSite 스키마)
export function generateWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

// Breadcrumb JSON-LD 생성
export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// 본문에서 설명 추출 헬퍼
function extractDescription(content: string, maxLength: number): string {
  try {
    // BlockNote JSON 포맷인 경우
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      const textParts: string[] = []
      for (const block of parsed) {
        if (block.content && Array.isArray(block.content)) {
          for (const item of block.content) {
            if (item.type === "text" && item.text) {
              textParts.push(item.text)
            }
          }
        }
        if (textParts.join(" ").length >= maxLength) break
      }
      const text = textParts.join(" ").trim()
      return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text
    }
  } catch {
    // 일반 텍스트인 경우
    const plainText = content
      .replace(/<[^>]+>/g, "") // HTML 태그 제거
      .replace(/[#*_~`]/g, "") // 마크다운 기호 제거
      .replace(/\s+/g, " ")    // 공백 정리
      .trim()
    
    return plainText.length > maxLength 
      ? plainText.slice(0, maxLength - 3) + "..." 
      : plainText
  }
  
  return siteConfig.description
}
