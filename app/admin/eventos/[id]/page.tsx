import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '@/components/admin/AdminHeader';
import EventOrdersManager from '@/components/admin/EventOrdersManager';
import { formatLongDate, formatTime } from '@/lib/utils';
import type { AdminOrderRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isStaff } = await supabase.rpc('is_staff').returns<boolean>();
  if (!isStaff) redirect('/admin');

  // Evento
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (!event) notFound();

  // Órdenes del evento
  const { data: ordersData } = await supabase
    .rpc('admin_list_orders', { p_event_id: id, p_status: null })
    .single<AdminOrderRow[]>();

  const orders: AdminOrderRow[] = Array.isArray(ordersData) ? ordersData : [];

  const verified = orders.filter((o) => o.status === 'verified').length;
  const checkedIn = orders.filter((o) => o.status === 'checked_in').length;
  const pending = orders.filter((o) => o.status === 'pending').length;
  const uploaded = orders.filter((o) => o.status === 'payment_uploaded').length;
  const rejected = orders.filter((o) => o.status === 'rejected').length;
  const ticketsSold = orders
    .filter((o) => ['verified', 'checked_in'].includes(o.status))
    .reduce((sum, o) => sum + o.quantity, 0);
  const revenue = orders
    .filter((o) => ['verified', 'checked_in'].includes(o.status))
    .reduce((sum, o) => sum + o.total_usd, 0);

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="mb-4 inline-block text-xs text-white/50 transition hover:text-white"
        >
          ← Volver a eventos
        </Link>

        {/* Header del evento */}
<div className="rounded-2xl border border-red-950/60 bg-gradient-to-br from-red-950/30 to-black p-5 sm:p-6">
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
        {formatLongDate(event.event_date)} · {formatTime(event.event_time)}
      </p>
      <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
        {event.name}
      </h1>
    </div>

    <Link
      href={`/admin/eventos/${id}/editar`}
      className="shrink-0 rounded-xl border border-red-500/40 bg-red-950/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-950/40"
    >
     Editar
    </Link>
  </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
            <span>📍 {event.venue}, {event.city}</span>
            {!event.is_active && (
              <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Inactivo
              </span>
            )}
            {event.is_sold_out && (
              <span className="rounded-full border border-red-500/50 bg-red-600/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300">
                Agotado
              </span>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Órdenes" value={orders.length} />
          <StatCard label="Pendientes" value={pending} tone="amber" />
          <StatCard label="Por verificar" value={uploaded} tone="sky" />
          <StatCard label="Verificadas" value={verified} tone="emerald" />
          <StatCard label="Check-in" value={checkedIn} tone="emerald" />
          <StatCard label="Rechazadas" value={rejected} tone="red" />
        </div>

        {/* Resumen de venta */}
        <div className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-red-950/60 bg-black/40 p-4">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              Entradas vendidas
            </p>
            <p className="mt-1 text-2xl font-black text-white">
              {ticketsSold}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              Ingresos confirmados
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-400">
              ${revenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Lista de órdenes */}
        <div className="mt-6">
        <EventOrdersManager
          eventId={id}
          eventName={event.name}
          eventDate={event.event_date}
          initialOrders={orders}
        />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'amber' | 'emerald' | 'red' | 'sky';
}) {
  const tones = {
    neutral: 'text-white',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    sky: 'text-sky-400',
  } as const;

  return (
    <div className="rounded-xl border border-red-950/60 bg-black/40 p-3">
      <p className="text-[9px] uppercase tracking-wide text-white/40 sm:text-[10px]">
        {label}
      </p>
      <p className={`mt-1 text-xl font-black sm:text-2xl ${tones[tone]}`}>
        {value}
      </p>
    </div>
  );
}