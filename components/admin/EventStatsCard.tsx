'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn, formatCurrency, formatLongDate, formatTime } from '@/lib/utils';
import type { AdminEventRow } from '@/lib/types';

interface EventStatsCardProps {
  event: AdminEventRow;
}

export default function EventStatsCard({ event }: EventStatsCardProps) {
  const soldPct =
    event.total_capacity > 0
      ? Math.round((event.total_sold / event.total_capacity) * 100)
      : 0;

  const isPast = new Date(event.event_date) < new Date();

  return (
    <Link
      href={`/admin/eventos/${event.id}`}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-red-950/60 bg-black transition hover:border-red-700',
        isPast && 'opacity-60',
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-red-950/40 via-black to-red-950/20">
        {event.cover_url ? (
          <Image
            src={event.cover_url}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 40%, rgba(220,38,38,0.4), transparent 60%), radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: 'auto, 24px 24px',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {event.is_sold_out && (
            <span className="rounded-full border border-red-500/50 bg-red-600 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
              Agotado
            </span>
          )}
          {!event.is_active && (
            <span className="rounded-full border border-white/20 bg-black/80 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/60 backdrop-blur">
              Inactivo
            </span>
          )}
          {isPast && (
            <span className="rounded-full border border-white/20 bg-black/80 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/60 backdrop-blur">
              Pasado
            </span>
          )}
        </div>

        {/* Pendientes badge */}
        {event.pending_orders > 0 && (
          <div className="absolute right-3 top-3 rounded-full border border-amber-500/50 bg-amber-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            {event.pending_orders} pendiente{event.pending_orders !== 1 ? 's' : ''}
          </div>
        )}

        {/* Info */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
            {formatLongDate(event.event_date)} · {formatTime(event.event_time)}
          </p>
          <h3 className="mt-1 line-clamp-1 text-lg font-black leading-tight text-white sm:text-xl">
            {event.name}
          </h3>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-white/50">Entradas vendidas</span>
            <span className="font-bold text-white">
              {event.total_sold} / {event.total_capacity}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                soldPct >= 90
                  ? 'bg-red-500'
                  : soldPct >= 60
                    ? 'bg-amber-500'
                    : 'bg-emerald-500',
              )}
              style={{ width: `${Math.min(soldPct, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-white/40">
            {soldPct}% vendido
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-red-950/60 bg-black/40 p-2 text-center">
            <p className="text-[9px] uppercase tracking-wide text-white/40">
              Verif.
            </p>
            <p className="mt-0.5 text-sm font-bold text-emerald-400">
              {event.verified_orders}
            </p>
          </div>
          <div className="rounded-lg border border-red-950/60 bg-black/40 p-2 text-center">
            <p className="text-[9px] uppercase tracking-wide text-white/40">
              Pend.
            </p>
            <p className="mt-0.5 text-sm font-bold text-amber-400">
              {event.pending_orders}
            </p>
          </div>
          <div className="rounded-lg border border-red-950/60 bg-black/40 p-2 text-center">
            <p className="text-[9px] uppercase tracking-wide text-white/40">
              Ingresos
            </p>
            <p className="mt-0.5 text-sm font-bold text-red-400">
              {formatCurrency(event.revenue_usd)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}