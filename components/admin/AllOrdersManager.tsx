'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import OrderVerificationModal from './OrderVerificationModal';
import { cn, formatLongDate } from '@/lib/utils';
import type { AdminOrderRow, AdminOrderWithEvent, OrderStatus } from '@/lib/types';

type FilterKey = OrderStatus | 'all' | 'needs_action';

const FILTERS: {
  key: FilterKey;
  label: string;
  match: (s: OrderStatus) => boolean;
}[] = [
  { key: 'needs_action', label: 'Por verificar', match: (s) => s === 'pending' || s === 'payment_uploaded' },
  { key: 'all', label: 'Todas', match: () => true },
  { key: 'verified', label: 'Verificadas', match: (s) => s === 'verified' },
  { key: 'checked_in', label: 'Check-in', match: (s) => s === 'checked_in' },
  { key: 'rejected', label: 'Rechazadas', match: (s) => s === 'rejected' },
  { key: 'cancelled', label: 'Canceladas', match: (s) => s === 'cancelled' },
];

const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: 'Sin pago',
    className: 'border-white/20 bg-white/5 text-white/60',
    dot: 'bg-white/40',
  },
  payment_uploaded: {
    label: 'Por verificar',
    className: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    dot: 'bg-amber-400',
  },
  verified: {
    label: 'Verificada',
    className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  rejected: {
    label: 'Rechazada',
    className: 'border-red-500/40 bg-red-500/15 text-red-300',
    dot: 'bg-red-500',
  },
  checked_in: {
    label: 'Check-in',
    className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200',
    dot: 'bg-emerald-400',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'border-white/20 bg-white/5 text-white/40',
    dot: 'bg-white/30',
  },
};

interface AllOrdersManagerProps {
  initialOrders: AdminOrderWithEvent[];
}

export default function AllOrdersManager({
  initialOrders,
}: AllOrdersManagerProps) {
  const supabaseRef = useRef(createClient());
  const [orders, setOrders] = useState<AdminOrderWithEvent[]>(initialOrders);
  const [filter, setFilter] = useState<FilterKey>('needs_action');
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [selected, setSelected] = useState<AdminOrderWithEvent | null>(null);
  const [live, setLive] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error } = await supabaseRef.current
      .rpc('admin_list_all_orders', { p_status: null })
      .single<AdminOrderWithEvent[]>();

    if (!error && data && Array.isArray(data)) {
      setOrders(data);
    }
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel('admin-all-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => void refresh(),
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Lista única de eventos para el filtro
  const eventList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; date: string }>();
    for (const o of orders) {
      if (!map.has(o.event_id)) {
        map.set(o.event_id, {
          id: o.event_id,
          name: o.event_name,
          date: o.event_date,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [orders]);

  // Filtrado
  const filtered = useMemo(() => {
    let rows = orders;

    if (filter !== 'all') {
      const f = FILTERS.find((x) => x.key === filter);
      if (f) rows = rows.filter((o) => f.match(o.status));
    }

    if (eventFilter !== 'all') {
      rows = rows.filter((o) => o.event_id === eventFilter);
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
  }, [orders, filter, eventFilter, search]);

  const pendingCount = orders.filter(
    (o) => o.status === 'payment_uploaded' || o.status === 'pending',
  ).length;

  return (
    <>
      {/* Header con stats */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              live ? 'animate-pulse bg-emerald-400' : 'bg-white/30',
            )}
          />
          <span className="text-xs text-white/60">
            {live ? 'Tiempo real' : 'Conectando…'}
          </span>
        </div>

        {pendingCount > 0 && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            {pendingCount} por verificar
          </span>
        )}

        <div className="ml-auto text-xs text-white/40">
          {filtered.length} de {orders.length} órdenes
        </div>
      </div>

      {/* Buscador */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por código, nombre, teléfono, cédula…"
        className="mb-4 min-h-[44px] w-full rounded-xl border border-red-950/60 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-red-500/70"
      />

      {/* Filtros de estado */}
      <div className="-mx-1 mb-3 overflow-x-auto px-1 no-scrollbar">
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

      {/* Filtros de evento */}
      {eventList.length > 1 && (
        <div className="-mx-1 mb-4 overflow-x-auto px-1 no-scrollbar">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setEventFilter('all')}
              className={cn(
                'shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition',
                eventFilter === 'all'
                  ? 'border-red-500 bg-red-600/20 text-red-300'
                  : 'border-red-950/60 text-white/50 hover:bg-white/5',
              )}
            >
              Todos los eventos
            </button>
            {eventList.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setEventFilter(ev.id)}
                className={cn(
                  'shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition',
                  eventFilter === ev.id
                    ? 'border-red-500 bg-red-600/20 text-red-300'
                    : 'border-red-950/60 text-white/50 hover:bg-white/5',
                )}
              >
                {ev.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-red-950/60 bg-black/40 px-6 py-16 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-4 text-sm font-bold text-white">
            Sin órdenes en este filtro
          </p>
          <p className="mt-2 text-xs text-white/50">
            Prueba con otro filtro o limpia la búsqueda.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const meta = STATUS_META[order.status];
            const needsAction =
              order.status === 'payment_uploaded' || order.status === 'pending';

            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelected(order)}
                className={cn(
                  'flex w-full flex-wrap items-center gap-3 rounded-xl border bg-black/40 p-3 text-left transition hover:border-red-800 hover:bg-red-950/20 sm:p-4',
                  needsAction ? 'border-amber-500/30' : 'border-red-950/60',
                )}
              >
                {/* Código */}
                <div className="flex shrink-0 flex-col">
                  <span className="font-mono text-xs font-bold text-red-400">
                    {order.code}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {new Date(order.created_at).toLocaleDateString('es-VE', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>

                {/* Cliente + evento */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {order.customer_name}
                  </p>
                  <p className="truncate text-[11px] text-white/50">
                    {order.customer_phone} · {order.event_name}
                  </p>
                </div>

                {/* Cantidad */}
                <div className="shrink-0 text-center">
                  <p className="text-[9px] uppercase tracking-wide text-white/40">
                    Entradas
                  </p>
                  <p className="text-sm font-black text-white">
                    {order.quantity}
                  </p>
                </div>

                {/* Total */}
                <div className="shrink-0 text-right">
                  <p className="text-[9px] uppercase tracking-wide text-white/40">
                    Total
                  </p>
                  <p className="text-sm font-black text-white">
                    ${order.total_usd.toFixed(2)}
                  </p>
                </div>

                {/* Estado */}
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                    meta.className,
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <OrderVerificationModal
          order={selected as AdminOrderRow}
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