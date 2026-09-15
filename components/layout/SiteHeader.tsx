'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Eventos', href: '#eventos' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Experiencia', href: '#experiencia' },
  { label: 'Contacto', href: '#contacto' },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-red-950/60 bg-black/85 backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          {/* Logo */}
            <Link
            href="/"
            className="stuffa-protected relative h-10 w-32 shrink-0 sm:h-14 sm:w-48"
            style={{
                colorScheme: 'only light',
                isolation: 'isolate',
            }}
            onClick={closeMenu}
            >
            <Image
                src="/stuffa-logo.png"
                alt="Stuffa Disco & Lounge"
                fill
                priority
                sizes="160px"
                className="object-contain object-left"
                style={{ colorScheme: 'only light' }}
            />
            </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTAs desktop */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/mi-orden"
              className="rounded-full border border-red-950/60 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70 transition hover:border-red-800 hover:text-white"
            >
              Mi orden
            </Link>
            <a
              href="#eventos"
              className="rounded-full bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500"
            >
              Comprar entradas
            </a>
          </div>

          {/* Hamburger móvil */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-950/60 bg-black/40 text-white md:hidden"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Menú móvil overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl md:hidden">
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 pt-20">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="w-full rounded-xl border border-red-950/60 bg-black/40 py-4 text-center text-lg font-bold text-white/90 transition hover:border-red-800 hover:bg-red-950/30"
              >
                {item.label}
              </a>
            ))}

            <a
              href="#eventos"
              onClick={closeMenu}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 py-4 text-center text-lg font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40"
            >
              Comprar entradas
            </a>

            <Link
              href="/mi-orden"
              onClick={closeMenu}
              className="w-full rounded-xl border border-red-950/60 py-3 text-center text-sm font-semibold text-white/60 transition hover:text-white"
            >
              Buscar mi orden
            </Link>
          </div>
        </div>
      )}
    </>
  );
}