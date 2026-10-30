'use client';

import { cn } from '@/lib/utils';

export type ScanResult =
  | {
      kind: 'success';
      message: string;
      code: string;
      customerName: string;
      quantity: number;
      eventName: string;
      consumption?: { name: string; quantity: number }[];
    }
  | {
      kind: 'warning';
      message: string;
      code: string;
      customerName: string;
      quantity: number;
      eventName: string;
      extra?: string;
      consumption?: { name: string; quantity: number }[];
    }
  | {
      kind: 'error';
      message: string;
      code?: string;
      customerName?: string;
      extra?: string;
    };

const META = {
  success: {
    border: 'border-emerald-500/50',
    bg: 'bg-gradient-to-br from-emerald-600/30 to-emerald-900/20',
    icon: '✅',
    title: 'text-emerald-300',
    btn: 'bg-emerald-600 hover:bg-emerald-500',
  },
  warning: {
    border: 'border-amber-500/50',
    bg: 'bg-gradient-to-br from-amber-600/30 to-amber-900/20',
    icon: '⚠️',
    title: 'text-amber-300',
    btn: 'bg-amber-600 hover:bg-amber-500',
  },
  error: {
    border: 'border-red-500/50',
    bg: 'bg-gradient-to-br from-red-600/30 to-red-900/20',
    icon: '❌',
    title: 'text-red-300',
    btn: 'bg-red-600 hover:bg-red-500',
  },
} as const;

export default function CheckInResult({ 
  result, 
  onClose 
}: { 
  result: ScanResult; 
  onClose: () => void; 
}) {
  const meta = META[result.kind];

  return (
    <div
      className={cn(
        'animate-fade-in overflow-hidden rounded-2xl border-2 shadow-2xl',
        meta.border,
        meta.bg,
      )}
    >
      <div className="flex items-start gap-4 p-5">
        <span className="text-4xl">{meta.icon}</span>

        <div className="min-w-0 flex-1">
          <p className={cn('text-lg font-black leading-tight sm:text-xl', meta.title)}>
            {result.message}
          </p>

          {result.customerName && (
            <p className="mt-1 truncate text-base font-bold text-white sm:text-lg">
              {result.customerName}
            </p>
          )}

          {result.code && (
            <p className="mt-0.5 font-mono text-xs text-white/60">
              {result.code}
            </p>
          )}

          {'quantity' in result && result.quantity > 0 && (
            <p className="mt-2 text-sm text-white/80">
              <span className="font-black text-white">{result.quantity}</span>{' '}
              {result.quantity === 1 ? 'entrada' : 'entradas'}
            </p>
          )}

          {'eventName' in result && result.eventName && (
            <p className="mt-1 text-xs text-white/50">
              🎵 {result.eventName}
            </p>
          )}

          {/* 🍾 CONSUMO */}
          {'consumption' in result && result.consumption && result.consumption.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2">
                🍾 Consumo comprado
              </p>
              <ul className="space-y-1">
                {result.consumption.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm font-bold text-white">
                    <span>{item.quantity}× {item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {'extra' in result && result.extra && (
            <p className="mt-2 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70">
              {result.extra}
            </p>
          )}
        </div>
      </div>

      {/* 🎯 BOTÓN DE ACEPTAR */}
      <div className="border-t border-white/10 bg-black/40 p-4">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "w-full rounded-xl px-4 py-3 text-base font-black uppercase tracking-wider text-white shadow-lg transition active:scale-95",
            meta.btn
          )}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}