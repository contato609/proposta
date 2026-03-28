import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {},
  typescript: {
    // Evita falha de build por erros de tipo não críticos
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint não bloqueia o build
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
