import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type StaffRole = 'hostess' | 'manager' | 'admin';

export interface StaffSession {
  userId: string;
  email: string;
  role: StaffRole;
  fullName: string | null;
}

/**
 * Verifica que haya un usuario logueado y sea staff.
 * Si no, redirige al login.
 */
export async function requireStaff(): Promise<StaffSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data } = await supabase
    .rpc('get_current_staff')
    .single<{
      user_id: string;
      role: StaffRole;
      full_name: string | null;
      email: string;
    }>();

  if (!data) {
    // Es usuario logueado pero no staff
    return {
      userId: user.id,
      email: user.email ?? '',
      role: 'hostess', // rol mínimo por defecto
      fullName: null,
    };
  }

  return {
    userId: data.user_id,
    email: data.email,
    role: data.role,
    fullName: data.full_name,
  };
}

/**
 * Verifica que el usuario tenga acceso completo.
 * Si es hostess (puerta), redirige a /admin/ordenes.
 */
export async function requireFullAccess(): Promise<StaffSession> {
  const session = await requireStaff();

  if (session.role === 'hostess') {
    redirect('/admin/ordenes');
  }

  return session;
}

/**
 * Retorna true si el rol tiene acceso completo
 */
export function hasFullAccess(role: StaffRole): boolean {
  return role === 'admin' || role === 'manager';
}