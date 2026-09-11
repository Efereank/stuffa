'use client';

import { useRouter } from 'next/navigation';
import { cn, formatLongDate, todayISO } from '@/lib/utils';

interface AdminDatePickerProps {
  selectedDate: string;
  /** Fechas abiertas en formato YYYY-MM-DD, ordenadas ascendentemente */
  openDates: string[];
}

export default function AdminDatePicker({
  selectedDate,
  openDates,
}: AdminDatePickerProps) {
  const router = useRouter();
  const today = todayISO();
  const isToday = selectedDate === today;
  const isOpen = openDates.includes(selectedDate);

  // Próxima fecha abierta estrictamente mayor a la actual
  const nextOpen = openDates.find((d) => d > selectedDate) ?? null;
  // Anterior fecha abierta estrictamente menor a la actual
  const lessDates = openDates.filter((d) => d < selectedDate);
  const prevOpen = lessDates.length > 0 ? lessDates[lessDates.length - 1] : null;

  // Botón "Hoy": si hoy es abierto, va a hoy; si no, va al próximo abierto
  const todayTarget = openDates.includes(today) ? today : nextOpen;

  function handleChange(newDate: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return;
    router.push(`/admin?date=${newDate}`, { scroll: false });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-950/60 bg-black/40 p-2.5 sm:p-3">
        <button
          type="button"
          onClick={() => prevOpen && handleChange(prevOpen)}
          disabled={!prevOpen}
          aria-label="Día abierto anterior"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm transition',
            prevOpen
              ? 'border-red-900/60 text-white/80 hover:bg-red-950/30 active:bg-red-900/40'
              : 'cursor-not-allowed border-white/5 text-white/20',
          )}
        >
          ←
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-[44px] rounded-lg border border-red-950/60 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/70 [color-scheme:dark]"
        />

        <button
          type="button"
          onClick={() => nextOpen && handleChange(nextOpen)}
          disabled={!nextOpen}
          aria-label="Día abierto siguiente"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm transition',
            nextOpen
              ? 'border-red-900/60 text-white/80 hover:bg-red-950/30 active:bg-red-900/40'
              : 'cursor-not-allowed border-white/5 text-white/20',
          )}
        >
          →
        </button>

        <span className="ml-1 flex-1 truncate text-xs capitalize text-white/60 sm:text-sm">
          {formatLongDate(selectedDate)}
        </span>

        {!isToday && todayTarget && (
          <button
            type="button"
            onClick={() => handleChange(todayTarget)}
            className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
          >
            Hoy
          </button>
        )}
      </div>

      {/* Indicador abierto / cerrado */}
      <div className="flex items-center gap-2 px-2 text-[11px] sm:text-xs">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            isOpen ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-neutral-600',
          )}
        />
        <span className={isOpen ? 'text-emerald-300' : 'text-white/50'}>
          {isOpen
            ? 'Día abierto · reservas habilitadas'
            : 'Día cerrado · sin reservas'}
        </span>
      </div>
    </div>
  );
}