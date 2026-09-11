'use client';

import { useRouter } from 'next/navigation';
import { cn, formatLongDate, todayISO } from '@/lib/utils';

export default function AdminDatePicker({
  selectedDate,
}: {
  selectedDate: string;
}) {
  const router = useRouter();
  const today = todayISO();
  const isToday = selectedDate === today;

  function handleChange(newDate: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return;
    router.push(`/admin?date=${newDate}`, { scroll: false });
  }

  function shift(delta: number) {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const nd = new Date(Date.UTC(y, m - 1, d + delta));
    handleChange(nd.toISOString().slice(0, 10));
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 sm:p-3">
      <button
        type="button"
        onClick={() => shift(-1)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 text-sm text-white/80 hover:bg-white/5 active:bg-white/10"
        aria-label="Día anterior"
      >
        ←
      </button>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => handleChange(e.target.value)}
        className="min-h-[44px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/70 [color-scheme:dark]"
      />

      <button
        type="button"
        onClick={() => shift(1)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 text-sm text-white/80 hover:bg-white/5 active:bg-white/10"
        aria-label="Día siguiente"
      >
        →
      </button>

      <span className="ml-1 flex-1 truncate text-xs capitalize text-white/60 sm:text-sm">
        {formatLongDate(selectedDate)}
      </span>

      {!isToday && (
        <button
          type="button"
          onClick={() => handleChange(today)}
          className={cn(
            'rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20',
          )}
        >
          Hoy
        </button>
      )}
    </div>
  );
}