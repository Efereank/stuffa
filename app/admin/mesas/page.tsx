import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TablesManager from '@/components/admin/TablesManager';

export const dynamic = 'force-dynamic';

export default async function AdminTablesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isStaff } = await supabase.rpc('is_staff').returns<boolean>();
  if (!isStaff) redirect('/admin');

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="mx-auto w-full max-w-4xl px-3 pb-16 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-5 sm:mb-6">
          <div className="mb-3 flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
            >
              ← Volver
            </Link>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400 sm:text-xs">
            Stuffa · Admin
          </p>
          <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">
            Mesas del local
          </h1>
          <p className="mt-2 max-w-xl text-xs text-white/50 sm:text-sm">
            Ajusta la capacidad y el consumo mínimo de cada mesa. También
            puedes activar o desactivar mesas para mantenimiento.
          </p>
        </header>

        <TablesManager />
      </div>
    </main>
  );
}