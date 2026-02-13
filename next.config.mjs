/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-markdown', 'rehype-katex', 'remark-math', 'remark-gfm', 'katex'],
  typescript: {
    // ignoreBuildErrors: false,
  },
  images: {
    // Next.js 이미지 최적화 활성화
    unoptimized: false,
    // WebP/AVIF 포맷 자동 변환
    formats: ['image/avif', 'image/webp'],
    // 지원할 디바이스 너비
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // 이미지 사이즈
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 외부 이미지 도메인 설정
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    // 캐시 설정 (30일)
    minimumCacheTTL: 2592000,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'bookish-doodle-pj69w4g9rv6r294x-3000.app.github.dev',
      ],
    },
  },
  // 정적 캐싱 헤더 설정
  async headers() {
    return [
      {
        // 정적 자산 (JS, CSS, 폰트, 이미지)
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Next.js 빌드 아티팩트
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Next.js 이미지 최적화 캐시
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=2592000',
          },
        ],
      },
      {
        // 인증/개인화 경로는 공유 캐시 비활성화
        source: '/edit/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/todo/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        // 공개 페이지 캐시
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig
