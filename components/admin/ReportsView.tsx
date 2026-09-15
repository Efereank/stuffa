'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn, formatBs, formatCurrency, formatShortDate } from '@/lib/utils';
import type { MonthlyReport } from '@/lib/types';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const METHOD_LABELS: Record<string, string> = {
  pago_movil: 'Pago Móvil',
  zelle: 'Zelle',
  binance: 'Binance Pay',
  sin_metodo: 'Sin método',
};

interface ReportsViewProps {
  report: MonthlyReport;
  year: number;
  month: number;
}

export default function ReportsView({ report, year, month }: ReportsViewProps) {
  const [showAllEvents, setShowAllEvents] = useState(false);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    const today = new Date();
    const isCurrentOrPast =
      y < today.getFullYear() ||
      (y === today.getFullYear() && m <= today.getMonth() + 1);

    if (!isCurrentOrPast && delta > 0) return;

    window.location.href = `/admin/reportes?year=${y}&month=${m}`;
  }

  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth() + 1;

  const attendanceRate =
    report.total_tickets_sold > 0
      ? Math.round((report.total_checked_in / report.total_tickets_sold) * 100)
      : 0;

  const avgTicket =
    report.total_tickets_sold > 0
      ? report.total_revenue_usd / report.total_tickets_sold
      : 0;

  const maxDayRevenue = Math.max(
    1,
    ...report.by_day.map((d) => d.revenue),
  );

  const eventsToShow = showAllEvents
    ? report.by_event
    : report.by_event.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Selector de mes */}
      <div className="flex items-center gap-3 rounded-2xl border border-red-950/60 bg-black/40 p-3">
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
            Reporte mensual
          </p>
          <p className="mt-0.5 text-lg font-black text-white sm:text-xl">
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={isCurrentMonth}
          aria-label="Mes siguiente"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-white/80 transition',
            isCurrentMonth
              ? 'cursor-not-allowed border-white/5 text-white/20'
              : 'border-red-900/60 hover:bg-red-950/30',
          )}
        >
          →
        </button>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <StatCard
          label="Ingresos USD"
          value={formatCurrency(report.total_revenue_usd)}
          sub={`${formatBs(report.total_revenue_bs)}`}
          tone="emerald"
        />
        <StatCard
          label="Entradas vendidas"
          value={String(report.total_tickets_sold)}
          sub={`${report.total_orders} órdenes`}
          tone="sky"
        />
        <StatCard
          label="Eventos"
          value={String(report.total_events)}
          sub={`${report.total_checked_in} check-ins`}
          tone="neutral"
        />
        <StatCard
          label="Asistencia"
          value={`${attendanceRate}%`}
          sub={
            report.pending_orders > 0
              ? `${report.pending_orders} pendientes`
              : 'Todo verificado'
          }
          tone="amber"
        />
      </div>

      {/* Stats secundarias */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <StatCard
          label="Ticket promedio"
          value={formatCurrency(avgTicket)}
          tone="amber"
        />
        <StatCard
          label="Rechazadas"
          value={String(report.rejected_orders)}
          tone="red"
        />
        <StatCard
          label="Por verificar"
          value={String(report.pending_orders)}
          tone="amber"
        />
      </div>

      {/* Gráfico diario */}
      <section className="rounded-2xl border border-red-950/60 bg-black/40 p-4 sm:p-5">
        <h2 className="mb-1 text-sm font-black text-white sm:text-base">
          Ventas por día
        </h2>
        <p className="mb-4 text-[11px] text-white/40">
          {formatShortDate(report.from)} — {formatShortDate(report.to)}
        </p>

        {report.by_day.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">
            Sin ventas registradas este mes
          </p>
        ) : (
          <div className="space-y-2">
            {report.by_day.map((d) => {
              const pct = (d.revenue / maxDayRevenue) * 100;
              return (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                    {formatShortDate(d.date)}
                  </span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-white/5">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-red-700 via-red-600 to-red-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {d.tickets} tickets
                    </span>
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs font-bold text-white">
                    {formatCurrency(d.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Desglose por método de pago */}
      <section className="rounded-2xl border border-red-950/60 bg-black/40 p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-black text-white sm:text-base">
          Por método de pago
        </h2>

        {report.by_payment_method.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">
            Sin datos este mes
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.by_payment_method.map((m) => (
              <div
                key={m.method}
                className="rounded-xl border border-red-950/60 bg-black/40 p-3.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  {METHOD_LABELS[m.method] ?? m.method}
                </p>
                <p className="mt-2 text-xl font-black text-white">
                  {formatCurrency(m.revenue)}
                </p>
                <p className="mt-0.5 text-[11px] text-white/50">
                  {m.tickets} tickets · {m.orders} órdenes
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top eventos */}
      <section className="rounded-2xl border border-red-950/60 bg-black/40 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black text-white sm:text-base">
            Eventos del mes
          </h2>
          {report.by_event.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllEvents((v) => !v)}
              className="text-[11px] font-semibold text-red-400 transition hover:text-red-300"
            >
              {showAllEvents
                ? 'Ver menos'
                : `Ver todos (${report.by_event.length})`}
            </button>
          )}
        </div>

        {report.by_event.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">
            Sin eventos este mes
          </p>
        ) : (
          <div className="space-y-2">
            {eventsToShow.map((ev, i) => {
              const soldPct =
                ev.capacity > 0
                  ? Math.round((ev.tickets_sold / ev.capacity) * 100)
                  : 0;

              return (
                <Link
                  key={ev.id}
                  href={`/admin/eventos/${ev.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-red-950/60 bg-black/40 p-3 transition hover:border-red-800 hover:bg-red-950/20"
                >
                  {/* Rank */}
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black',
                      i === 0
                        ? 'bg-amber-400 text-black'
                        : i === 1
                          ? 'bg-neutral-400 text-black'
                          : i === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/10 text-white/60',
                    )}
                  >
                    {i + 1}
                  </span>

                  {/* Nombre + fecha */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {ev.name}
                    </p>
                    <p className="text-[10px] text-white/50">
                      {formatShortDate(ev.event_date)}
                    </p>
                  </div>

                  {/* Progress mini */}
                  <div className="hidden min-w-[100px] shrink-0 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500"
                        style={{ width: `${Math.min(soldPct, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[9px] text-white/40">
                      {soldPct}%
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-white">
                      {formatCurrency(ev.revenue)}
                    </p>
                    <p className="text-[10px] text-white/50">
                      {ev.tickets_sold} tickets
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'neutral' | 'emerald' | 'red' | 'amber' | 'sky';
}) {
  const tones = {
    neutral: 'text-white',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    sky: 'text-sky-400',
  } as const;

  return (
    <div className="rounded-2xl border border-red-950/60 bg-black/40 p-3.5 sm:p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>
      <p className={cn('mt-1 text-xl font-black sm:text-2xl', tones[tone])}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 truncate text-[10px] text-white/40 sm:text-[11px]">
          {sub}
        </p>
      )}
    </div>
  );
}