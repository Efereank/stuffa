'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import EventStatsCard from './EventStatsCard';
import { cn } from '@/lib/utils';
import type { AdminEventRow } from '@/lib/types';

interface EventsManagerProps {
  events: AdminEventRow[];
}

type FilterKey = 'all' | 'active' | 'past' | 'pending';

export default function EventsManager({ events }: EventsManagerProps) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10);

    switch (filter) {
      case 'active':
        return events.filter((e) => e.is_active && e.event_date >= now);
      case 'past':
        return events.filter((e) => e.event_date < now);
      case 'pending':
        return events.filter((e) => e.pending_orders > 0);
      default:
        return events;
    }
  }, [events, filter]);

  const totalEvents = events.length;
  const totalPending = events.reduce((sum, e) => sum + e.pending_orders, 0);
  const totalRevenue = events.reduce((sum, e) => sum + e.revenue_usd, 0);

  return (
    <div className="space-y-5">
      {/* Stats globales */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-red-950/60 bg-black/40 p-3 sm:p-4">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            Eventos
          </p>
          <p className="mt-1 text-2xl font-black text-white">{totalEvents}</p>
        </div>
        <div className="rounded-2xl border border-red-950/60 bg-black/40 p-3 sm:p-4">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            Pendientes
          </p>
          <p className="mt-1 text-2xl font-black text-amber-400">
            {totalPending}
          </p>
        </div>
        <div className="rounded-2xl border border-red-950/60 bg-black/40 p-3 sm:p-4">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            Ingresos totales
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-400">
            ${totalRevenue.toFixed(0)}
          </p>
        </div>
        <div className="rounded-2xl border border-red-950/60 bg-black/40 p-3 sm:p-4">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            Vendidos
          </p>
          <p className="mt-1 text-2xl font-black text-red-400">
            {events.reduce((sum, e) => sum + e.total_sold, 0)}
          </p>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
          <div className="flex gap-1.5">
            {(
              [
                { key: 'all', label: 'Todos' },
                { key: 'active', label: 'Activos' },
                { key: 'pending', label: 'Con pendientes' },
                { key: 'past', label: 'Pasados' },
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
          href="/admin/eventos/nuevo"
          className="rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500"
        >
          + Nuevo evento
        </Link>
      </div>

      {/* Grid de eventos */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-red-950/60 bg-black/40 px-6 py-16 text-center">
          <p className="text-4xl">📅</p>
          <p className="mt-4 text-lg font-bold text-white">
            Sin eventos {filter !== 'all' ? 'en este filtro' : ''}
          </p>
          <p className="mt-2 text-sm text-white/50">
            {filter === 'all'
              ? 'Crea tu primer evento para empezar a vender entradas.'
              : 'Prueba con otro filtro.'}
          </p>
          {filter === 'all' && (
            <Link
              href="/admin/eventos/nuevo"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40"
            >
              + Crear primer evento
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ev) => (
            <EventStatsCard key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </div>
  );
}