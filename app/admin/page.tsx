import { createClient } from '@/lib/supabase/server';
import { requireFullAccess } from '@/lib/auth';
import AdminHeader from '@/components/admin/AdminHeader';
import EventsManager from '@/components/admin/EventsManager';
import { getCurrentMonth } from '@/lib/utils';
import type { AdminEventRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Parsea un valor a número entero positivo, o devuelve null si es inválido
 */
function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseInt(value, 10);
  if (isNaN(num) || !isFinite(num) || num <= 0) return null;
  return num;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  // 🛡️ Verificar que el usuario sea admin/manager. Si es hostess, redirige a /admin/ordenes
  await requireFullAccess();

  const supabase = await createClient();
  const params = await searchParams;
  const current = getCurrentMonth();

  // Validación estricta
  const parsedYear = parsePositiveInt(params.year);
  const parsedMonth = parsePositiveInt(params.month);

  const year =
    parsedYear !== null && parsedYear >= 2020 && parsedYear <= 2100
      ? parsedYear
      : current.year;

  const month =
    parsedMonth !== null && parsedMonth >= 1 && parsedMonth <= 12
      ? parsedMonth
      : current.month;

  // Cargar eventos del mes
  const { data: eventsData } = await supabase
    .rpc('admin_list_events_monthly', { p_year: year, p_month: month })
    .single<AdminEventRow[]>();

  const events: AdminEventRow[] = Array.isArray(eventsData) ? eventsData : [];

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            Eventos
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Gestiona tus eventos y revisa las ventas del mes.
          </p>
        </div>

        <EventsManager events={events} year={year} month={month} />
      </main>
    </div>
  );
}