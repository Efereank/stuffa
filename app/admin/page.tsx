import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminDatePicker from '@/components/admin/AdminDatePicker';
import { todayISO } from '@/lib/utils';
import type { AdminReservation, OpenDate } from '@/lib/types';

export const dynamic = 'force-dynamic';

const RESERVATION_SELECT = `
  id, code, customer_name, customer_phone, customer_email,
  party_size, reservation_date, reservation_time, status,
  qr_token, notes, checked_in_at,
  tables ( code, zones ( name ) )
`;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isStaff } = await supabase.rpc('is_staff').returns<boolean>();

  if (!isStaff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-center text-sm text-red-300">
          Tu cuenta no tiene permisos de staff. Contacta al administrador.
        </p>
      </main>
    );
  }

  const today = todayISO();
  const [y, m, d] = today.split('-').map(Number);

  // Traemos 6 meses de días abiertos (pasados incluidos para el botón ←)
  const from = new Date(Date.UTC(y, m - 1, d - 30)).toISOString().slice(0, 10);
  const to = new Date(Date.UTC(y, m - 1 + 6, d)).toISOString().slice(0, 10);

  const { data: openDatesData } = await supabase
    .rpc('get_open_dates', { p_from: from, p_to: to })
    .returns<OpenDate[]>();

  const openDates = Array.isArray(openDatesData)
    ? openDatesData.map((o) => o.date).sort()
    : [];

  // Fecha por defecto: hoy si está abierto, si no el próximo día abierto
  const fallbackDate =
    openDates.find((d) => d >= today) ?? openDates[openDates.length - 1] ?? today;

  const selectedDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : fallbackDate;

  const { data: reservations } = await supabase
    .from('reservations')
    .select(RESERVATION_SELECT)
    .eq('reservation_date', selectedDate)
    .order('reservation_time', { ascending: true })
    .returns<AdminReservation[]>();

  const isToday = selectedDate === today;

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="mx-auto w-full max-w-5xl px-3 pb-16 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-red-500 sm:text-xs">
              Stuffa · Panel Hostess
            </p>
            <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">
              {isToday ? 'Reservas de hoy' : 'Reservas del día'}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/reportes"
              className="rounded-xl border border-red-950/60 bg-black/40 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-red-950/30"
            >
               Reportes
            </Link>
            <Link
              href="/admin/mesas"
              className="rounded-xl border border-red-950/60 bg-black/40 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-red-950/30"
            >
               Mesas
            </Link>
            <Link
              href="/admin/dias"
              className="rounded-xl border border-red-950/60 bg-black/40 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-red-950/30"
            >
               Días
            </Link>
          </div>
        </header>

        <AdminDatePicker
          selectedDate={selectedDate}
          openDates={openDates}
        />

        <div className="mt-4">
          <AdminDashboard
            key={selectedDate}
            initialReservations={reservations ?? []}
            date={selectedDate}
          />
        </div>
      </div>
    </main>
  );
}