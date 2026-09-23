import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Stuffa Disco & Lounge · Experiencia Nocturna Premium',
    template: '%s · Stuffa',
  },
  description:
    'Los dueños de la rumba los fines de semana. Compra tus entradas para los eventos de Stuffa Disco & Lounge en Maracaibo.',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Stuffa Disco & Lounge',
    title: 'Stuffa Disco & Lounge · Experiencia Nocturna Premium',
    description:
      'Compra tus entradas para los eventos de Stuffa Disco & Lounge en Maracaibo.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Stuffa Disco & Lounge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stuffa Disco & Lounge',
    description: 'Compra tus entradas para los eventos de Stuffa.',
    images: ['/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`dark ${inter.variable}`}>
      <body
        className={`${inter.className} min-h-dvh scroll-smooth bg-black text-white antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}