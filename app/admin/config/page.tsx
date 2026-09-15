import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '@/components/admin/AdminHeader';
import PaymentConfigForm from '@/components/admin/PaymentConfigForm';
import type { PaymentConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminConfigPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isStaff } = await supabase.rpc('is_staff').returns<boolean>();
  if (!isStaff) redirect('/admin');

  const { data: configs } = await supabase
    .from('payment_configs')
    .select('method, is_active, config')
    .order('method');

  const methods: PaymentConfig[] = Array.isArray(configs)
    ? (configs as PaymentConfig[])
    : [];

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
            Stuffa · Admin
          </p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            Métodos de pago
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Configura los datos que verán los clientes al momento de pagar.
          </p>
        </div>

        <PaymentConfigForm initial={methods} />
      </main>
    </div>
  );
}