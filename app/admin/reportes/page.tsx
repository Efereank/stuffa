import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ReportesView from '@/components/admin/ReportesView';
import type { AdminStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isStaff } = await supabase.rpc('is_staff').returns<boolean>();
  if (!isStaff) redirect('/admin');

  // Últimos 60 días y próximos 30
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 60);
  const to = new Date(today);
  to.setDate(to.getDate() + 30);

  const fromISO = from.toISOString().slice(0, 10);
  const toISO = to.toISOString().slice(0, 10);

  const { data: stats } = await supabase
    .rpc('admin_get_stats', { p_from: fromISO, p_to: toISO })
    .single()
    .returns<AdminStats>();

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="mx-auto w-full max-w-5xl px-3 pb-16 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-5 sm:mb-6">
          <Link
            href="/admin"
            className="mb-3 inline-block rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
          >
            ← Volver
          </Link>
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400 sm:text-xs">
            Stuffa · Admin
          </p>
          <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">
            Reportes
          </h1>
          <p className="mt-2 text-xs text-white/50 sm:text-sm">
            Últimos 60 días y próximos 30.
          </p>
        </header>

        <ReportesView stats={stats ?? null} from={fromISO} to={toISO} />
      </div>
    </main>
  );
}