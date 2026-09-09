import '@/index.css';
import { Providers } from './providers';
import { getBaseUrl } from '@/lib/siteUrl';
import { getCachedPublicSettings } from '@/lib/serverPublicData';

// Metadados padrão de todo o site. Cada página sobrescreve title/description
// com o próprio conteúdo (template "%s | Nome da loja").
export async function generateMetadata() {
  const settings = await getCachedPublicSettings().catch(() => null);
  const storeName = settings?.store_name || 'Prestiger Motors';
  const tagline = settings?.store_tagline || 'Veículos selecionados, prontos para entrega.';
  const description =
    settings?.footer_about ||
    `${tagline} Confira o catálogo da ${storeName}, agende sua visita e fale com a equipe pelo WhatsApp.`;

  // Favicon e ícone do iOS saem do logo cadastrado no admin; sem logo (ou com
  // logo em SVG, que o iOS não aceita) usamos os arquivos da pasta public.
  const logo = settings?.logo_url || '';
  const logoIsSvg = /\.svg(\?|$)/i.test(logo);

  return {
    metadataBase: new URL(getBaseUrl()),
    title: {
      default: `${storeName} | ${tagline}`,
      template: `%s | ${storeName}`,
    },
    description,
    applicationName: storeName,
    generator: 'Next.js',
    keywords: [
      'carros usados',
      'seminovos',
      'veículos',
      'comprar carro',
      'vender carro',
      storeName,
    ],
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: '/',
      siteName: storeName,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: storeName }],
      title: `${storeName} | ${tagline}`,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/opengraph-image.png'],
      title: `${storeName} | ${tagline}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    icons: {
      icon: logo || { url: '/icon.svg', type: 'image/svg+xml' },
      shortcut: logo || '/icon.svg',
      apple:
        logo && !logoIsSvg
          ? { url: logo, sizes: '180x180' }
          : { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    },
    appleWebApp: { title: storeName },
    manifest: '/manifest.webmanifest',
  };
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0E13' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
