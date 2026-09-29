'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EventStatsCard from './EventStatsCard';
import {
  cn,
  formatCurrency,
  getMonthName,
  getCurrentMonth,
  shiftYearMonth,
} from '@/lib/utils';
import type { AdminEventRow } from '@/lib/types';

interface EventsManagerProps {
  events: AdminEventRow[];
  year: number;
  month: number;
}

type FilterKey = 'all' | 'active' | 'past' | 'pending';

/** Máximo de meses al futuro que se puede navegar */
const MAX_MONTHS_AHEAD = 12;

export default function EventsManager({
  events,
  year,
  month,
}: EventsManagerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('all');

  const currentMonth = getCurrentMonth();
  const isCurrentMonth =
    year === currentMonth.year && month === currentMonth.month;

  // ¿Estamos en el mes máximo permitido?
  const maxFuture = shiftYearMonth(
    currentMonth.year,
    currentMonth.month,
    MAX_MONTHS_AHEAD,
  );
  const isMaxFuture =
    year > maxFuture.year ||
    (year === maxFuture.year && month >= maxFuture.month);

  // ¿Estamos en el mes mínimo? (por si algún día queremos limitar atrás)
  // Deshabilitado por ahora: se puede ir atrás indefinidamente

  function shiftMonth(delta: number) {
    if (!year || !month || isNaN(year) || isNaN(month)) {
      router.push(
        `/admin?year=${currentMonth.year}&month=${currentMonth.month}`,
        { scroll: false },
      );
      return;
    }

    const next = shiftYearMonth(year, month, delta);

    // Bloquear si excede el máximo futuro
    if (
      next.year > maxFuture.year ||
      (next.year === maxFuture.year && next.month > maxFuture.month)
    ) {
      return;
    }

    router.push(`/admin?year=${next.year}&month=${next.month}`, {
      scroll: false,
    });
  }

  // Filtrado por estado
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

  // Totales del mes
  const totals = useMemo(() => {
    let revenue = 0;
    let sold = 0;
    let pending = 0;

    for (const e of events) {
      revenue += e.revenue_usd;
      sold += e.total_sold;
      pending += e.pending_orders;
    }

    return {
      events: events.length,
      revenue,
      sold,
      pending,
    };
  }, [events]);

  // Etiqueta del estado del mes actual
  const monthLabel = isCurrentMonth
    ? 'Mes actual'
    : isMaxFuture
      ? 'Límite de navegación'
      : 'Mes';

  return (
    <div className="space-y-5">
      {/* Selector de mes */}
      <div className="flex items-center gap-3 rounded-2xl border border-red-950/60 bg-black/40 p-3 sm:p-4">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Mes anterior"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-900/60 text-white/80 transition hover:bg-red-950/30"
        >
          ←
        </button>

        <div className="flex-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
            {monthLabel}
          </p>
          <p className="mt-0.5 text-lg font-black text-white sm:text-xl">
            {getMonthName(month)} {year}
          </p>
        </div>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={isMaxFuture}
          aria-label="Mes siguiente"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition',
            isMaxFuture
              ? 'cursor-not-allowed border-white/5 text-white/20'
              : 'border-red-900/60 text-white/80 hover:bg-red-950/30',
          )}
        >
          →
        </button>
      </div>

      {/* Stats del mes */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-red-950/60 bg-black/40 p-3 sm:p-4">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            Eventos
          </p>
          <p className="mt-1 text-2xl font-black text-white">
            {totals.events}
          </p>
        </div>
        <div className="rounded-2xl border border-red-950/60 bg-black/40 p-3 sm:p-4">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            Pendientes
          </p>
          <p className="mt-1 text-2xl font-black text-amber-400">
            {totals.pending}
          </p>
        </div>
        <div className="rounded-2xl border border-red-950/60 bg-black/40 p-3 sm:p-4">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            Ingresos del mes
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-400">
            {formatCurrency(totals.revenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-red-950/60 bg-black/40 p-3 sm:p-4">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            Entradas vendidas
          </p>
          <p className="mt-1 text-2xl font-black text-red-400">
            {totals.sold}
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
            Sin eventos{' '}
            {filter !== 'all' ? 'en este filtro' : `en ${getMonthName(month)}`}
          </p>
          <p className="mt-2 text-sm text-white/50">
            {filter === 'all'
              ? 'Crea un evento nuevo o navega a otro mes.'
              : 'Prueba con otro filtro.'}
          </p>
          {filter === 'all' && (
            <Link
              href="/admin/eventos/nuevo"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40"
            >
              + Crear evento
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