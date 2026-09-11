import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import BookingFlow from '@/components/booking/BookingFlow';
import { todayISO } from '@/lib/utils';
import type { MapTable, OpenDate } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const supabase = await createClient();

  const today = todayISO();
  const [y, m, d] = today.split('-').map(Number);
  const to = new Date(Date.UTC(y, m - 1 + 6, d)).toISOString().slice(0, 10);

  const { data: openDates } = await supabase
    .rpc('get_open_dates', { p_from: today, p_to: to })
    .returns<OpenDate[]>();

  // Supabase may return an error-like object instead of an array in some cases.
  // Normalize to an array so the UI always receives string[]
  const availableDates: string[] = Array.isArray(openDates)
    ? openDates.map((o) => o.date)
    : [];

  const selectedDate =
    date && availableDates.includes(date)
      ? date
      : availableDates[0] ?? today;

  const { data: tables } = await supabase
    .rpc('get_tables_for_date', { p_date: selectedDate })
    .returns<MapTable[]>();

  // Supabase may return an error-like object instead of an array in some cases.
  // Normalize to an array so the UI always receives MapTable[]
  const tablesArray: MapTable[] = Array.isArray(tables) ? tables : [];

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <header className="mb-6 flex flex-col items-start gap-4 sm:mb-10">
          {/* Logo */}
          <div className="relative h-16 w-56 sm:h-20 sm:w-72">
            <Image
              src="/stuffa-logo.png"
              alt="Stuffa Disco & Lounge"
              fill
              priority
              sizes="(max-width: 640px) 224px, 288px"
              className="object-contain object-left"
            />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-red-500 sm:text-xs">
              Reserva tu mesa
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">
              Elige tu lugar en{' '}
              <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                Stuffa
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-xs text-white/60 sm:text-sm">
             Somos los dueños de la rumba los fines de semana.
              Selecciona la mesa que prefieras.
            </p>
          </div>
        </header>

        <BookingFlow
          tables={tablesArray}
          date={selectedDate}
          availableDates={availableDates}
        />
      </div>
    </main>
  );
}