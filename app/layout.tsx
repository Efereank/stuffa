import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Stuffa Disco & Lounge — Reserva tu mesa',
  description: 'Selecciona tu mesa en el plano y reserva en segundos.',
  icons: {
    icon: '/stuffa-logo.png',
    apple: '/stuffa-logo.png',
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
        className={`${inter.className} stuffa-bg min-h-dvh text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}