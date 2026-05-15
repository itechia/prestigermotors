import '@/index.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Prestiger Motors',
  description: 'Encontre o veículo dos seus sonhos',
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
