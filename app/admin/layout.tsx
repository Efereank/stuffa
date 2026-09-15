import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si no está logueado Y no está en /admin/login → redirigir
  // Nota: esta lógica se delega a las páginas hijas,
  // porque /admin/login NO debe tener el AdminHeader.
  return <>{children}</>;
}