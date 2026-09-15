'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import EventOrderRow from './EventOrderRow';
import OrderVerificationModal from './OrderVerificationModal';
import { cn } from '@/lib/utils';
import type { AdminOrderRow, OrderStatus } from '@/lib/types';

interface EventOrdersManagerProps {
  eventId: string;
  initialOrders: AdminOrderRow[];
}

type FilterKey = OrderStatus | 'all' | 'needs_action';

const FILTERS: { key: FilterKey; label: string; match: (s: OrderStatus) => boolean }[] = [
  { key: 'all', label: 'Todas', match: () => true },
  {
    key: 'needs_action',
    label: 'Por verificar',
    match: (s) => s === 'pending' || s === 'payment_uploaded',
  },
  { key: 'verified', label: 'Verificadas', match: (s) => s === 'verified' },
  { key: 'checked_in', label: 'Check-in', match: (s) => s === 'checked_in' },
  { key: 'rejected', label: 'Rechazadas', match: (s) => s === 'rejected' },
  { key: 'cancelled', label: 'Canceladas', match: (s) => s === 'cancelled' },
];

export default function EventOrdersManager({
  eventId,
  initialOrders,
}: EventOrdersManagerProps) {
  const supabaseRef = useRef(createClient());
  const [orders, setOrders] = useState<AdminOrderRow[]>(initialOrders);
  const [filter, setFilter] = useState<FilterKey>('needs_action');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminOrderRow | null>(null);
  const [live, setLive] = useState(false);

  // Refetch
  const refresh = useCallback(async () => {
    const { data, error } = await supabaseRef.current
      .rpc('admin_list_orders', { p_event_id: eventId, p_status: null })
      .single<AdminOrderRow[]>();

    if (!error && data && Array.isArray(data)) {
      setOrders(data);
    }
  }, [eventId]);

  // Realtime
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`admin-event-orders-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `event_id=eq.${eventId}`,
        },
        () => void refresh(),
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId, refresh]);

  // Filtrado
  const filtered = useMemo(() => {
    let rows = orders;

    if (filter !== 'all') {
      const f = FILTERS.find((x) => x.key === filter);
      if (f) rows = rows.filter((o) => f.match(o.status));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q) ||
          o.customer_cedula.toLowerCase().includes(q),
      );
    }

    return rows;
  }, [orders, filter, search]);

  const pendingCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'payment_uploaded',
  ).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-white sm:text-xl">Órdenes</h2>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                live ? 'animate-pulse bg-emerald-400' : 'bg-white/30',
              )}
            />
            <span className="text-[10px] text-white/50">
              {live ? 'Tiempo real' : 'Conectando…'}
            </span>
          </div>
          {pendingCount > 0 && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              {pendingCount} por verificar
            </span>
          )}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, nombre, teléfono…"
          className="min-h-[40px] w-full rounded-xl border border-red-950/60 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-red-500/70 sm:max-w-xs"
        />
      </div>

      {/* Filtros */}
      <div className="-mx-1 mb-4 overflow-x-auto px-1 no-scrollbar">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-wide transition',
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

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-red-950/60 bg-black/40 px-6 py-16 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-4 text-sm font-bold text-white">
            Sin órdenes en este filtro
          </p>
          <p className="mt-2 text-xs text-white/50">
            Cuando entren compras nuevas aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <EventOrderRow
              key={order.id}
              order={order}
              onSelect={() => setSelected(order)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <OrderVerificationModal
          order={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            void refresh();
          }}
        />
      )}
    </>
  );
}