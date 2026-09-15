import Image from 'next/image';
import Link from 'next/link';
import { cn, formatDayName, formatShortDate } from '@/lib/utils';
import type { EventSummary } from '@/lib/types';

interface EventCardProps {
  event: EventSummary;
  featured?: boolean;
}

export default function EventCard({ event, featured = false }: EventCardProps) {
  const [y, m, d] = event.event_date.split('-').map(Number);
  const dayNumber = String(d).padStart(2, '0');
  const monthName = new Intl.DateTimeFormat('es-MX', {
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));

  const soldOut = event.is_sold_out || event.available_tickets <= 0;

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-red-950/60 bg-black transition hover:border-red-700',
        featured && 'md:col-span-2 md:row-span-2',
      )}
    >
      {/* Imagen o placeholder */}
      <div
        className={cn(
          'relative w-full overflow-hidden bg-gradient-to-br from-red-950/40 via-black to-red-950/20',
          featured ? 'aspect-[16/10]' : 'aspect-[16/10]',
        )}
      >
        {event.cover_url ? (
          <Image
            src={event.cover_url}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 40%, rgba(220,38,38,0.35), transparent 60%), radial-gradient(circle at 70% 80%, rgba(153,27,27,0.25), transparent 60%), radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: 'auto, auto, 24px 24px',
            }}
          />
        )}

        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* Badge de fecha */}
        <div className="absolute left-4 top-4 overflow-hidden rounded-xl border border-red-500/40 bg-black/80 backdrop-blur">
          <div className="bg-gradient-to-br from-red-600 to-red-800 px-3 py-1 text-center text-[9px] font-bold uppercase tracking-widest text-white">
            {monthName}
          </div>
          <div className="px-3 py-1 text-center text-2xl font-black leading-none text-white">
            {dayNumber}
          </div>
        </div>

        {/* Badge AGOTADO */}
        {soldOut && (
          <div className="absolute right-4 top-4 rounded-full border border-red-500/50 bg-red-600/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur">
            Agotado
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 sm:text-xs">
          {formatDayName(event.event_date)} · {event.event_time.slice(0, 5)}
        </p>

        <h3
          className={cn(
            'mt-2 line-clamp-2 font-black leading-tight text-white transition group-hover:text-red-400',
            featured ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl',
          )}
        >
          {event.name}
        </h3>

        {event.description && (
          <p className="mt-2 line-clamp-2 text-xs text-white/50 sm:text-sm">
            {event.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="truncate text-[11px] text-white/40">
            📍 {event.venue}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
              soldOut
                ? 'bg-white/5 text-white/30'
                : 'bg-red-500/15 text-red-400',
            )}
          >
            {soldOut ? 'Agotado' : `${event.available_tickets} disp.`}
          </span>
        </div>
      </div>
    </Link>
  );
}