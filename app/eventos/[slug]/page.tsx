import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/Footer';
import EventCountdown from '@/components/landing/EventCountdown';
import UrgencyBadge from '@/components/landing/UrgencyBadge';
import { formatCurrency, formatLongDate, formatTime } from '@/lib/utils';
import type { EventDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .rpc('get_event_by_slug', { p_slug: slug })
    .single<EventDetail>();

  if (!data) notFound();

  const event = data;
  const ticket = event.ticket_types[0];
  const soldOut = !ticket || ticket.available <= 0 || event.is_sold_out;
  const soldPct =
    ticket && ticket.capacity > 0
      ? Math.round((ticket.sold / ticket.capacity) * 100)
      : 0;

  return (
    <>
      <SiteHeader />

      <main className="pt-24 sm:pt-28">
        <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
          <Link
            href="/#eventos"
            className="mb-6 inline-flex items-center gap-1 text-xs text-white/50 transition hover:text-white sm:text-sm"
          >
            ← Volver a eventos
          </Link>

          {/* Cover */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-red-950/60 bg-gradient-to-br from-red-950/40 via-black to-red-950/20">
            {event.cover_url ? (
              <Image
                src={event.cover_url}
                alt={event.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 30% 40%, rgba(220,38,38,0.35), transparent 60%), radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                  backgroundSize: 'auto, 24px 24px',
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {soldOut && (
              <div className="absolute right-4 top-4 rounded-full border border-red-500/50 bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                Agotado
              </div>
            )}
          </div>

          {/* Info del evento */}
          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-red-500 sm:text-xs">
                {formatLongDate(event.event_date)} · {formatTime(event.event_time)}
              </p>
              {!soldOut && ticket && (
                <UrgencyBadge
                  sold={ticket.sold}
                  capacity={ticket.capacity}
                  urgencyMultiplier={1.15}
                />
              )}
            </div>

            <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
              {event.name}
            </h1>

            {event.description && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
                {event.description}
              </p>
            )}

            {/* Info rápida */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Chip icon="">{event.venue}</Chip>
              <Chip icon="">{event.city}</Chip>
              {event.doors_open_at && (
                <Chip icon="">
                  Puertas: {formatTime(event.doors_open_at)}
                </Chip>
              )}
            </div>

            {/* Countdown grande */}
            {!soldOut && (
              <div className="mt-6 rounded-2xl border border-red-950/60 bg-black/40 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg"></span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500 sm:text-xs">
                    El evento comienza en
                  </p>
                </div>
                <EventCountdown
                  targetDate={`${event.event_date}T${event.event_time}`}
                  variant="large"
                />
              </div>
            )}
          </div>

          {/* Entradas */}
          {ticket && (
            <div className="mt-10">
              <h2 className="text-lg font-black text-white sm:text-xl">
                Entradas
              </h2>

              <div className="mt-4 rounded-2xl border border-red-950/60 bg-black/40 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white sm:text-xl">
                      {ticket.name}
                    </p>
                    {ticket.description && (
                      <p className="mt-1 text-xs text-white/50 sm:text-sm">
                        {ticket.description}
                      </p>
                    )}
                    <ul className="mt-4 space-y-1.5">
                      {ticket.benefits.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-sm text-white/70"
                        >
                          <span className="text-red-500">✓</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-black text-white">
                      {formatCurrency(ticket.price_usd)}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">
                      {ticket.available} disponibles
                    </p>
                  </div>
                </div>

                {/* Barra de progreso de ventas */}
                {!soldOut && ticket.capacity > 0 && (
                  <div className="mt-6 space-y-3">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-white/50">Vendidas</span>
                        <span className="font-bold text-white">
                          {soldPct}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-400 transition-all"
                          style={{
                            width: `${Math.min(100, soldPct)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">
                        {ticket.available} disponibles
                      </span>
                      <UrgencyBadge
                        sold={ticket.sold}
                        capacity={ticket.capacity}
                        urgencyMultiplier={1.15}
                        size="md"
                      />
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-5">
                  {soldOut ? (
                    <button
                      disabled
                      className="w-full cursor-not-allowed rounded-xl bg-white/5 px-6 py-4 text-sm font-black uppercase tracking-wider text-white/30"
                    >
                      Agotado
                    </button>
                  ) : (
                    <Link
                      href={`/eventos/${event.slug}/comprar`}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 active:scale-[0.98]"
                    >
                      Comprar entradas
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      >
                        <path
                          d="M5 12h14M13 5l7 7-7 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  )}

                  {!soldOut && (
                    <p className="mt-3 text-center text-[11px] text-white/40">
                       Alta demanda — asegura tu entrada ahora
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-red-950/60 bg-black/40 px-3 py-1.5 text-xs text-white/70 sm:text-sm">
      <span>{icon}</span>
      {children}
    </span>
  );
}