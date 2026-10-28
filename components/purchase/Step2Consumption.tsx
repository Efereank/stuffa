'use client';

import { useMemo, useState } from 'react';
import { cn, formatBs, formatCurrency } from '@/lib/utils';
import Step2ProductCard from './Step2ProductCard';
import OrderTimer from './OrderTimer';
import type { ConsumptionCategory, ConsumptionProduct } from '@/lib/types';

interface Step2ConsumptionProps {
  products: ConsumptionProduct[];
  quantity: number;
  exchangeRate: number;
  ticketPriceUsd: number;
  eventName: string;
  startTime: number;
  onExpire: () => void;
  onNext: (items: { product_id: string; quantity: number }[]) => void;
  onBack: () => void;
}

type FilterKey = 'all' | 'recommended' | ConsumptionCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'recommended', label: '⭐ Recomendados' },
  { key: 'combos', label: 'Combos' },
  { key: 'licores', label: 'Licores' },
  { key: 'cervezas', label: 'Cervezas' },
  { key: 'shots', label: 'Cocteles' },
  { key: 'refrescos', label: 'Refrescos' },
  { key: 'snacks', label: 'Snacks' },
];

export default function Step2Consumption({
  products,
  quantity,
  exchangeRate,
  ticketPriceUsd,
  eventName,
  startTime,
  onExpire,
  onNext,
  onBack,
}: Step2ConsumptionProps) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<FilterKey>('recommended');
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    let list = products;
    if (filter === 'recommended') {
      list = list.filter((p) => p.is_recommended);
    } else if (filter !== 'all') {
      list = list.filter((p) => p.category === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [products, filter, search]);

  const { items, consumptionTotal, itemsCount } = useMemo(() => {
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return null;
        return { product_id: product.id, quantity: qty };
      })
      .filter((x): x is { product_id: string; quantity: number } => x !== null);

    const consumptionTotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.product_id);
      return sum + (product ? product.price_usd * item.quantity : 0);
    }, 0);

    const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return { items, consumptionTotal, itemsCount };
  }, [cart, products]);

  const ticketSubtotal = ticketPriceUsd * quantity;
  const totalUsd = ticketSubtotal + consumptionTotal;
  const totalBs = totalUsd * exchangeRate;

  function setProductQty(productId: string, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext(items);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white sm:text-2xl">
          Elige tu consumo
        </h2>
        <p className="mt-1 text-xs text-white/50 sm:text-sm">
          En <b className="text-white">{eventName}</b> puedes agregar productos
          si quieres. <b className="text-emerald-400">Es opcional.</b>
        </p>
      </div>

      <div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto…"
          className={inputClass}
        />
      </div>

      <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
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

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-red-950/60 bg-black/40 px-6 py-12 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-3 text-sm font-bold text-white">
            Sin productos en este filtro
          </p>
          <p className="mt-1 text-xs text-white/50">
            Prueba con otra categoría o limpia la búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {filteredProducts.map((p) => (
            <Step2ProductCard
              key={p.id}
              product={p}
              quantity={cart[p.id] ?? 0}
              onChangeQuantity={(qty) => setProductQty(p.id, qty)}
            />
          ))}
        </div>
      )}

      {/* Resumen del carrito */}
      <div className="rounded-2xl border border-red-950/60 bg-black/40 p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-red-500">
          Resumen
        </p>

        {itemsCount > 0 ? (
          <div className="mb-3 max-h-40 space-y-2 overflow-y-auto border-b border-red-950/60 pb-3">
            {items.map((item) => {
              const product = products.find((p) => p.id === item.product_id);
              if (!product) return null;
              return (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-white/70">
                    {item.quantity}× {product.name}
                  </span>
                  <span className="font-bold text-white">
                    {formatCurrency(product.price_usd * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mb-3 text-xs text-white/40">
            Aún no has agregado productos.
          </p>
        )}

        {/* Totales y Reloj */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 space-y-1.5 text-sm">
            <Row
              label={`Boletos (${quantity} × ${formatCurrency(ticketPriceUsd)})`}
              value={formatCurrency(ticketSubtotal)}
            />
            <Row
              label={`Consumo (${itemsCount} ${itemsCount === 1 ? 'producto' : 'productos'})`}
              value={formatCurrency(consumptionTotal)}
            />
            <div className="mt-2 flex items-center justify-between border-t border-red-950/60 pt-2">
              <span className="text-xs uppercase tracking-wide text-white/60">
                Total USD
              </span>
              <span className="text-lg font-black text-red-400">
                {formatCurrency(totalUsd)}
              </span>
            </div>
            <div className="flex items-center justify-between text-white/50">
              <span className="text-xs">Total Bs.</span>
              <span className="font-mono text-sm">{formatBs(totalBs)}</span>
            </div>
          </div>
          
          {/* 🎯 EL RELOJ AL LADO DE LOS TOTALES */}
          <div className="sm:mb-1">
            <OrderTimer startTime={startTime} onExpire={onExpire} />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] rounded-xl border border-red-950/60 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-red-950/30 hover:text-white"
        >
          ← Volver
        </button>
        <button
          type="submit"
          className="min-h-[52px] rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 active:scale-[0.98]"
        >
          Continuar al pago →
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full min-h-[48px] rounded-xl border border-red-950/60 bg-black/40 px-4 py-3 text-sm text-white ' +
  'placeholder:text-white/30 outline-none transition ' +
  'focus:border-red-500/70 focus:bg-black/60 focus:ring-2 focus:ring-red-500/30 ' +
  '[color-scheme:dark]';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-white/70">
      <span>{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}