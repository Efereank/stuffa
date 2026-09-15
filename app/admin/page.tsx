import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '@/components/admin/AdminHeader';
import EventsManager from '@/components/admin/EventsManager';
import type { AdminEventRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isStaff } = await supabase.rpc('is_staff').returns<boolean>();

  if (!isStaff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4">
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-center text-sm text-red-300">
          Tu cuenta no tiene permisos de staff. Contacta al administrador.
        </p>
      </main>
    );
  }

  const { data: eventsData } = await supabase
    .rpc('admin_list_events')
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
            Gestiona tus eventos, verifica pagos y controla la venta de entradas.
          </p>
        </div>

        <EventsManager events={events} />
      </main>
    </div>
  );
}