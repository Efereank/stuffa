'use client';

import { formatCurrency } from '@/lib/utils';
import type { MapTable } from '@/lib/types';

interface TableDetailCardProps {
  table: MapTable;
  onClose: () => void;
  onContinue: () => void;
}

export default function TableDetailCard({
  table,
  onClose,
  onContinue,
}: TableDetailCardProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm animate-fade-in sm:hidden"
      />

      <div
        role="dialog"
        aria-label={`Detalle de ${table.code}`}
        className="fixed inset-x-0 bottom-0 z-40 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
      >
        <div className="safe-bottom animate-slide-up rounded-t-3xl border border-red-900/50 bg-neutral-950/95 p-5 shadow-[0_-10px_40px_rgba(220,38,38,0.15)] backdrop-blur-xl sm:animate-fade-in sm:rounded-2xl sm:pb-5">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-red-900/50 sm:hidden" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
                {table.zone_name}
              </p>
              <h3 className="mt-1 text-2xl font-black text-white">{table.code}</h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mr-1 -mt-1 rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-red-950/60 bg-red-950/10 p-3">
              <dt className="text-[10px] uppercase tracking-wider text-white/50">
                Capacidad
              </dt>
              <dd className="mt-1 text-lg font-bold text-white">
                {table.capacity}{' '}
                <span className="text-sm font-normal text-white/50">pers.</span>
              </dd>
            </div>
            <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/10 p-3">
              <dt className="text-[10px] uppercase tracking-wider text-white/50">
                Consumo mínimo
              </dt>
              <dd className="mt-1">
                <span className="text-lg font-bold text-yellow-400">
                  {formatCurrency(table.min_consumption)}
                </span>
                {table.min_consumption_label && (
                  <span className="mt-0.5 block text-[11px] text-white/50">
                    {table.min_consumption_label}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={onContinue}
            className="mt-5 min-h-[52px] w-full rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-5 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 hover:shadow-red-800/60 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 active:scale-[0.98]"
          >
            Continuar con la reserva
          </button>
        </div>
      </div>
    </>
  );
}