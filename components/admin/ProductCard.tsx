'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn, formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    base_price_usd: number;
    image_url: string | null;
    is_recommended: boolean;
    is_active: boolean;
    sort_order: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  licores: 'Licores',
  cervezas: 'Cervezas',
  shots: 'Shots',
  refrescos: 'Refrescos',
  snacks: 'Snacks',
  combos: 'Combos',
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/admin/productos/${product.id}/editar`}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-red-950/60 bg-black transition hover:border-red-700',
        !product.is_active && 'opacity-60',
      )}
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-red-950/40 via-black to-red-950/20">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-30">🍾</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-red-500/50 bg-red-600 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
            {CATEGORY_LABELS[product.category] ?? product.category}
          </span>
          {product.is_recommended && (
            <span className="rounded-full border border-amber-500/50 bg-amber-600 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
              ⭐ Recomendado
            </span>
          )}
          {!product.is_active && (
            <span className="rounded-full border border-white/20 bg-black/80 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/60 backdrop-blur">
              Inactivo
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-black leading-tight text-white">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-white/50">
            {product.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-white/40">
            Precio base
          </span>
          <span className="text-lg font-black text-red-400">
            {formatCurrency(product.base_price_usd)}
          </span>
        </div>
      </div>
    </Link>
  );
}