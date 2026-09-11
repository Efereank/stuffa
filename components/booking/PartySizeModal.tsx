'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PartySizeModalProps {
  open: boolean;
  initialValue?: number;
  onConfirm: (size: number) => void;
  onClose?: () => void;
  /** Si es true, no se puede cerrar sin elegir (primera vez) */
  required?: boolean;
}

const MIN_PARTY = 1;
const MAX_PARTY = 20;
const QUICK_PICKS = [2, 4, 6, 8, 10, 12];

export default function PartySizeModal({
  open,
  initialValue = 2,
  onConfirm,
  onClose,
  required = false,
}: PartySizeModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !required) onClose?.();
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onEsc);
    };
  }, [open, required, onClose]);

  if (!open) return null;

  function bump(delta: number) {
    setValue((v) => Math.max(MIN_PARTY, Math.min(MAX_PARTY, v + delta)));
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={() => !required && onClose?.()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom w-full max-w-sm rounded-t-3xl border border-red-900/50 bg-neutral-950 shadow-2xl shadow-red-950/40 animate-slide-up sm:animate-fade-in sm:rounded-2xl sm:pb-0"
      >
        {/* Handle móvil */}
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-red-900/50 sm:hidden" />

        <div className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
            Stuffa · Reserva
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            ¿Cuántas personas son?
          </h2>
          <p className="mt-1 text-xs text-white/50 sm:text-sm">
            Así te mostramos solo las mesas disponibles para tu grupo.
          </p>

          {/* Selector grande */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => bump(-1)}
              disabled={value <= MIN_PARTY}
              aria-label="Menos personas"
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-2xl font-bold transition',
                value > MIN_PARTY
                  ? 'border-red-900/60 bg-red-950/30 text-white hover:bg-red-900/40 active:scale-95'
                  : 'cursor-not-allowed border-white/5 text-white/20',
              )}
            >
              −
            </button>

            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-red-950/60 bg-black/50 py-3">
              <span className="text-4xl font-black text-white sm:text-5xl">
                {value}
              </span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                {value === 1 ? 'persona' : 'personas'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => bump(1)}
              disabled={value >= MAX_PARTY}
              aria-label="Más personas"
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-2xl font-bold transition',
                value < MAX_PARTY
                  ? 'border-red-900/60 bg-red-950/30 text-white hover:bg-red-900/40 active:scale-95'
                  : 'cursor-not-allowed border-white/5 text-white/20',
              )}
            >
              +
            </button>
          </div>

          {/* Atajos rápidos */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {QUICK_PICKS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValue(n)}
                className={cn(
                  'min-w-[52px] rounded-xl border px-3 py-2 text-sm font-bold transition',
                  value === n
                    ? 'border-red-500 bg-red-600/30 text-white'
                    : 'border-red-950/60 bg-black/30 text-white/60 hover:border-red-800 hover:bg-red-950/30',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Footer con botón */}
        <div className="border-t border-red-950/60 p-4">
          <button
            type="button"
            onClick={() => onConfirm(value)}
            className="min-h-[52px] w-full rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 active:scale-[0.98]"
          >
            Ver mesas disponibles
          </button>

          {!required && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-2 min-h-[44px] w-full rounded-xl border border-white/10 px-6 py-3 text-xs font-semibold text-white/60 hover:bg-white/5"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}