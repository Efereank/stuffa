'use client';

import { cn, formatCurrency, formatShortDate } from '@/lib/utils';
import type { AdminStats } from '@/lib/types';

export default function ReportesView({
  stats,
  from,
  to,
}: {
  stats: AdminStats | null;
  from: string;
  to: string;
}) {
  if (!stats) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/50">
        Sin datos disponibles.
      </p>
    );
  }

  const totalEvents = stats.total_reservations + stats.cancelled;
  const noShowRate =
    stats.total_reservations > 0
      ? Math.round((stats.no_show / stats.total_reservations) * 100)
      : 0;

  // Máximo de personas por día para escalar las barras
  const maxGuests = Math.max(1, ...stats.daily.map((d) => d.guests));

  return (
    <div className="space-y-5">
      {/* Rango */}
      <p className="text-xs text-white/40">
        Del {formatShortDate(from)} al {formatShortDate(to)}
      </p>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <StatCard
          label="Reservas"
          value={String(stats.total_reservations)}
          sub={`${totalEvents} eventos en total`}
        />
        <StatCard
          label="Personas"
          value={String(stats.total_guests)}
          sub="Reservas activas + check-in"
          tone="sky"
        />
        <StatCard
          label="Check-in"
          value={String(stats.checked_in)}
          sub="Llegaron al local"
          tone="emerald"
        />
        <StatCard
          label="No-show"
          value={`${noShowRate}%`}
          sub={`${stats.no_show} reservas no llegaron`}
          tone="red"
        />
        <StatCard
          label="Canceladas"
          value={String(stats.cancelled)}
          sub="Por el cliente o staff"
          tone="neutral"
        />
        <StatCard
          label="Ingreso estimado"
          value={formatCurrency(stats.estimated_revenue)}
          sub="Consumo mínimo de reservas"
          tone="amber"
        />
      </div>

      {/* Barras diarias */}
      <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
        <h2 className="mb-3 text-sm font-bold text-white">
          Personas por noche
        </h2>
        {stats.daily.length === 0 ? (
          <p className="text-xs text-white/50">Sin reservas en este período.</p>
        ) : (
          <div className="space-y-1.5">
            {stats.daily.slice(-15).map((d) => {
              const pct = (d.guests / maxGuests) * 100;
              return (
                <div key={d.date} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] text-white/50 sm:text-xs">
                    {formatShortDate(d.date)}
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded-md bg-white/5">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right text-[10px] text-white/60 sm:text-xs">
                    {d.guests} p.
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Top mesas */}
      <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
        <h2 className="mb-3 text-sm font-bold text-white">
          Top mesas más reservadas
        </h2>
        {stats.top_tables.length === 0 ? (
          <p className="text-xs text-white/50">Sin datos todavía.</p>
        ) : (
          <div className="space-y-1">
            {stats.top_tables.map((t, i) => (
              <div
                key={`${t.code}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
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
                  <div>
                    <p className="text-sm font-semibold text-white">{t.code}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                      {t.zone}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-400">
                  {t.total}×
                </span>
              </div>
            ))}
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
  tone?: 'neutral' | 'amber' | 'emerald' | 'sky' | 'red';
}) {
  const tones = {
    neutral: 'text-white',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    sky: 'text-sky-400',
    red: 'text-red-400',
  } as const;

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-3 sm:p-4">
      <p className="text-[10px] uppercase tracking-wide text-white/40 sm:text-[11px]">
        {label}
      </p>
      <p className={cn('mt-1 text-xl font-black sm:text-2xl', tones[tone])}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-white/40">{sub}</p>}
    </div>
  );
}