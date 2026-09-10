/** @type {import('next').NextConfig} */

// Cabeçalhos de segurança aplicados a todas as respostas.
//
// A CSP aqui é deliberadamente curta: os tours 360 são HTML de terceiros
// renderizados em <iframe srcDoc sandbox>, e um iframe srcdoc herda a CSP da
// página. Diretivas como script-src/frame-src quebrariam esses tours. As três
// abaixo não interferem no carregamento de recursos:
//   base-uri      bloqueia injeção de <base> para sequestrar caminhos relativos
//   frame-ancestors  impede que o site (e o /admin) seja embutido em iframe
//   object-src    bloqueia <object>/<embed> (plugins legados)
const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: "base-uri 'self'; frame-ancestors 'self'; object-src 'none'",
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig = {
  reactStrictMode: true,

  // Não anunciar a versão do framework para quem estiver sondando o site.
  poweredByHeader: false,

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

  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        // O painel nunca deve aparecer em buscador, nem por link direto.
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

module.exports = nextConfig;
