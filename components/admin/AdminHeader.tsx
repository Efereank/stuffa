import { createClient } from '@/lib/supabase/server';
import AdminHeaderClient from './AdminHeaderClient';
import type { StaffRole } from '@/lib/auth';

export default async function AdminHeader() {
  const supabase = await createClient();

  const { data } = await supabase
    .rpc('get_current_staff')
    .single<{
      role: StaffRole;
      full_name: string | null;
      email: string;
    }>();

  const role: StaffRole = data?.role ?? 'hostess';
  const fullName = data?.full_name ?? null;

  return <AdminHeaderClient role={role} fullName={fullName} />;
}