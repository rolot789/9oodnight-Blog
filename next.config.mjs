/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-markdown', 'rehype-katex', 'remark-math', 'remark-gfm', 'katex'],
  typescript: {
    // ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'bookish-doodle-pj69w4g9rv6r294x-3000.app.github.dev',
      ],
    },
  },
}

export default nextConfig
