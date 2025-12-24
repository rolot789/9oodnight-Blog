/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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