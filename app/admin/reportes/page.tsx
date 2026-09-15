import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '@/components/admin/AdminHeader';
import ReportsView from '@/components/admin/ReportsView';
import type { MonthlyReport } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isStaff } = await supabase.rpc('is_staff').returns<boolean>();
  if (!isStaff) redirect('/admin');

  const params = await searchParams;

  const today = new Date();
  const year = parseInt(params.year ?? String(today.getFullYear()), 10);
  const month = parseInt(params.month ?? String(today.getMonth() + 1), 10);

  // Validar rango
  const safeYear = isNaN(year) ? today.getFullYear() : year;
  const safeMonth = isNaN(month) || month < 1 || month > 12 ? today.getMonth() + 1 : month;

  const { data: reportData } = await supabase
    .rpc('admin_monthly_report', { p_year: safeYear, p_month: safeMonth })
    .single<MonthlyReport>();

  const report = reportData ?? {
    year: safeYear,
    month: safeMonth,
    from: `${safeYear}-${String(safeMonth).padStart(2, '0')}-01`,
    to: `${safeYear}-${String(safeMonth).padStart(2, '0')}-28`,
    total_events: 0,
    total_orders: 0,
    total_tickets_sold: 0,
    total_checked_in: 0,
    total_revenue_usd: 0,
    total_revenue_bs: 0,
    pending_orders: 0,
    rejected_orders: 0,
    by_payment_method: [],
    by_event: [],
    by_day: [],
  };

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
            Stuffa · Admin
          </p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            Reportes
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Estadísticas mensuales de ventas y asistencia.
          </p>
        </div>

        <ReportsView
          report={report}
          year={safeYear}
          month={safeMonth}
        />
      </main>
    </div>
  );
}