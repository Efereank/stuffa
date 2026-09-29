import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '@/components/admin/AdminHeader';
import EventForm from '@/components/admin/EventForm';
import { requireFullAccess } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function NewEventPage() {
  await requireFullAccess();
  const supabase = await createClient();

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="mb-4 inline-block text-xs text-white/50 transition hover:text-white"
        >
          ← Volver a eventos
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            Nuevo evento
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Crea un nuevo evento para empezar a vender entradas.
          </p>
        </div>

        <EventForm mode="create" />
      </main>
    </div>
  );
}