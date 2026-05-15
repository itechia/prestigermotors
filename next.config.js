/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ESLint 9 não é compatível com eslint-config-next ainda; verificar separadamente
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript: erros de type-check não bloqueiam o build (projeto JS+JSX sem strict)
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;
