import EventCard from './EventCard';
import type { EventSummary } from '@/lib/types';

interface EventsSectionProps {
  events: EventSummary[];
}

export default function EventsSection({ events }: EventsSectionProps) {
  return (
    <section
      id="eventos"
      className="relative border-t border-red-950/60 bg-black px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-red-500 sm:text-xs">
              Cartelera
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
              PRÓXIMOS EVENTOS
            </h2>
          </div>
          <p className="max-w-md text-xs text-white/50 sm:text-sm">
            Venta de entradas limitada. Compra la tuya antes de que se agoten.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-red-950/60 bg-black/40 px-6 py-16 text-center">
            <p className="text-4xl">🎫</p>
            <p className="mt-4 text-lg font-bold text-white">
              No hay eventos programados
            </p>
            <p className="mt-2 text-sm text-white/50">
              Vuelve pronto o síguenos en Instagram para enterarte primero.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev, i) => (
              <EventCard
                key={ev.id}
                event={ev}
                featured={i === 0 && events.length > 2}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}