'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Eventos', href: '/admin', exact: true },
  { label: 'Órdenes', href: '/admin/ordenes', exact: false },
  { label: 'Escanear', href: '/admin/escaner', exact: false },
  { label: 'Reportes', href: '/admin/reportes', exact: false },
  { label: 'Pagos', href: '/admin/config', exact: false },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-red-950/60 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + label */}
          <Link href="/admin" className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
              Stuffa
            </span>
            <span className="hidden text-xs font-semibold text-white/60 sm:inline">
              · Panel Admin
            </span>
          </Link>

          {/* Nav */}
          <nav className="-mx-2 flex flex-1 items-center gap-1 overflow-x-auto px-2 no-scrollbar">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition',
                    isActive
                      ? 'bg-red-600/20 text-red-300'
                      : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-lg border border-red-950/60 bg-black/40 px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-red-800 hover:text-white"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}