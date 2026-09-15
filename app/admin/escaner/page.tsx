import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '@/components/admin/AdminHeader';
import CheckInScanner from '@/components/admin/CheckInScanner';

export const dynamic = 'force-dynamic';

export default async function AdminScannerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isStaff } = await supabase.rpc('is_staff').returns<boolean>();
  if (!isStaff) redirect('/admin');

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
            Stuffa · Admin
          </p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            Escáner QR
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Escanea el QR del cliente para hacer check-in en la entrada.
          </p>
        </div>

        <CheckInScanner />
      </main>
    </div>
  );
}