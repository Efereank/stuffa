'use client';

import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import type { ConsumptionProduct } from '@/lib/types';

interface Step2ProductCardProps {
  product: ConsumptionProduct;
  quantity: number;
  onChangeQuantity: (qty: number) => void;
}

export default function Step2ProductCard({
  product,
  quantity,
  onChangeQuantity,
}: Step2ProductCardProps) {
  const inCart = quantity > 0;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-black transition',
        inCart
          ? 'border-red-500 shadow-lg shadow-red-950/40'
          : 'border-red-950/60 hover:border-red-800',
      )}
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-red-950/40 via-black to-red-950/20">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-30">🍾</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        {product.is_recommended && (
          <span className="absolute left-2 top-2 rounded-full border border-amber-500/50 bg-amber-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
            ⭐ Recomendado
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-black leading-tight text-white">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-1 line-clamp-2 text-[11px] text-white/50">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-3">
          <p className="mb-2 text-base font-black text-red-400">
            {formatCurrency(product.price_usd)}
          </p>

          {/* Controles */}
          {inCart ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-red-500/50 bg-red-950/30 px-2 py-1.5">
              <button
                type="button"
                onClick={() => onChangeQuantity(Math.max(0, quantity - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-lg font-bold text-white transition hover:bg-black/60 active:scale-95"
                aria-label="Quitar uno"
              >
                −
              </button>
              <span className="text-base font-black text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onChangeQuantity(quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-lg font-bold text-white transition hover:bg-red-500 active:scale-95"
                aria-label="Añadir uno"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onChangeQuantity(1)}
              className="w-full rounded-xl border border-red-900/60 bg-red-950/30 py-2 text-xs font-black uppercase tracking-wider text-red-300 transition hover:bg-red-900/40 hover:text-white"
            >
              + Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}