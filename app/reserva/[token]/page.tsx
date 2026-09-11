import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ReservationTicketView from '@/components/booking/ReservationTicketView';
import type { ReservationTicket } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolved = await params;
  const token = resolved?.token;

  console.log('🔵 [reserva] token recibido:', token);

  if (!token) {
    console.log('🔴 [reserva] no hay token');
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('get_reservation_by_token', { p_token: token })
    .returns<ReservationTicket | null>()
    .single();

  // Ensure proper typing for data (supabase client sometimes widens to `never`)
  const reservation = data as ReservationTicket | null;

  console.log('🟡 [reserva] data:', JSON.stringify(reservation));
  console.log('🟡 [reserva] error:', JSON.stringify(error));

  if (error) {
    console.log('🔴 [reserva] RPC error:', error.message);
  }

  if (!reservation) {
    console.log('🔴 [reserva] data es null/undefined → notFound');
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
        <h1 className="text-center text-xl font-black text-white sm:text-2xl">
          {reservation.status === 'cancelled'
            ? 'Reserva cancelada'
            : '¡Tu mesa está apartada! 🎉'}
        </h1>

        <ReservationTicketView reservation={reservation} />

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/mi-reserva"
            className="text-sm text-amber-400 underline-offset-4 hover:underline"
          >
            Buscar otra reserva
          </Link>
          <Link
            href="/"
            className="text-sm text-white/50 underline-offset-4 hover:underline"
          >
            Hacer una nueva reserva
          </Link>
        </div>
      </div>
    </main>
  );
}