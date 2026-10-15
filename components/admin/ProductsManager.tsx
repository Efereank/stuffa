'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  base_price_usd: number;
  image_url: string | null;
  is_recommended: boolean;
  is_active: boolean;
  sort_order: number;
}

interface ProductsManagerProps {
  products: Product[];
}

type FilterKey =
  | 'all'
  | 'recommended'
  | 'licores'
  | 'cervezas'
  | 'shots'
  | 'refrescos'
  | 'snacks'
  | 'combos'
  | 'inactive';

export default function ProductsManager({ products }: ProductsManagerProps) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    switch (filter) {
      case 'recommended':
        return products.filter((p) => p.is_recommended && p.is_active);
      case 'inactive':
        return products.filter((p) => !p.is_active);
      case 'all':
        return products.filter((p) => p.is_active);
      default:
        return products.filter((p) => p.category === filter && p.is_active);
    }
  }, [products, filter]);

  const totals = useMemo(() => {
    const active = products.filter((p) => p.is_active).length;
    const recommended = products.filter(
      (p) => p.is_recommended && p.is_active,
    ).length;
    const inactive = products.filter((p) => !p.is_active).length;
    return { total: products.length, active, recommended, inactive };
  }, [products]);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatBox label="Total" value={totals.total} />
        <StatBox label="Activos" value={totals.active} tone="emerald" />
        <StatBox label="Recomendados" value={totals.recommended} tone="amber" />
        <StatBox label="Inactivos" value={totals.inactive} tone="neutral" />
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
          <div className="flex gap-1.5">
            {(
              [
                { key: 'all', label: 'Todos' },
                { key: 'recommended', label: '⭐ Recomendados' },
                { key: 'licores', label: 'Licores' },
                { key: 'cervezas', label: 'Cervezas' },
                { key: 'shots', label: 'Shots' },
                { key: 'refrescos', label: 'Refrescos' },
                { key: 'snacks', label: 'Snacks' },
                { key: 'combos', label: 'Combos' },
                { key: 'inactive', label: 'Inactivos' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition',
                  filter === f.key
                    ? 'border-red-500 bg-red-600/20 text-red-300'
                    : 'border-red-950/60 text-white/50 hover:bg-white/5',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Link
          href="/admin/productos/nuevo"
          className="rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500"
        >
          + Nuevo producto
        </Link>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-red-950/60 bg-black/40 px-6 py-16 text-center">
          <p className="text-4xl">🍾</p>
          <p className="mt-4 text-lg font-bold text-white">
            Sin productos en este filtro
          </p>
          <p className="mt-2 text-sm text-white/50">
            Crea uno nuevo o cambia el filtro.
          </p>
          <Link
            href="/admin/productos/nuevo"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40"
          >
            + Crear producto
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'emerald' | 'amber' | 'red';
}) {
  const tones = {
    neutral: 'text-white',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  } as const;

  return (
    <div className="rounded-2xl border border-red-950/60 bg-black/40 p-3 sm:p-4">
      <p className="text-[10px] uppercase tracking-wide text-white/40">
        {label}
      </p>
      <p className={cn('mt-1 text-2xl font-black', tones[tone])}>{value}</p>
    </div>
  );
}