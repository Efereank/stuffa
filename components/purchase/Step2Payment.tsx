'use client';

import { useState } from 'react';
import { cn, formatCurrency, formatBs } from '@/lib/utils';
import type { PaymentConfig, PaymentMethod } from '@/lib/types';

interface Step2PaymentProps {
  methods: PaymentConfig[];
  totalUsd: number;
  exchangeRate: number;
  onNext: (method: PaymentMethod) => void;
  onBack: () => void;
}

const METHOD_META: Record<
  PaymentMethod,
  { label: string; icon: string; description: string }
> = {
  pago_movil: {
    label: 'Pago Móvil',
    icon: '📱',
    description: 'Transferencia directa desde tu teléfono móvil',
  },
  zelle: {
    label: 'Zelle',
    icon: '💳',
    description: 'Transferencia bancaria en dólares',
  },
  binance: {
    label: 'Binance Pay',
    icon: '🪙',
    description: 'Pago con criptomonedas',
  },
};

export default function Step2Payment({
  methods,
  totalUsd,
  exchangeRate,
  onNext,
  onBack,
}: Step2PaymentProps) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const totalBs = totalUsd * exchangeRate;

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  const selectedConfig = methods.find((m) => m.method === selected);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white sm:text-2xl">
          Selecciona método de pago
        </h2>
        <p className="mt-1 text-xs text-white/50 sm:text-sm">
          Elige cómo quieres pagar tus entradas
        </p>
      </div>

      {/* Resumen de la compra */}
      <div className="rounded-2xl border border-red-950/60 bg-black/40 p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-red-500">
          Resumen
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white/70">
            <span>Total USD</span>
            <span className="font-bold text-white">
              {formatCurrency(totalUsd)}
            </span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Tasa BCV</span>
            <span className="font-mono text-white/90">
              Bs. {exchangeRate.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-red-950/60 pt-2">
            <span className="text-xs uppercase tracking-wide text-white/60">
              Total en bolívares
            </span>
            <span className="text-lg font-black text-red-400">
              {formatBs(totalBs)}
            </span>
          </div>
        </div>
      </div>

      {/* Métodos disponibles */}
      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map((m) => {
          const meta = METHOD_META[m.method];
          const isSelected = selected === m.method;

          return (
            <button
              key={m.method}
              type="button"
              onClick={() => setSelected(m.method)}
              className={cn(
                'flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition',
                isSelected
                  ? 'border-red-500 bg-red-600/20 shadow-lg shadow-red-900/40'
                  : 'border-red-950/60 bg-black/40 hover:border-red-800',
              )}
            >
              <div className="flex w-full items-start justify-between">
                <span className="text-3xl">{meta.icon}</span>
                {isSelected && (
                  <span className="rounded-full border border-red-400 bg-red-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                    ✓ Seleccionado
                  </span>
                )}
              </div>
              <div>
                <p className="text-base font-black text-white sm:text-lg">
                  {meta.label}
                </p>
                <p className="mt-0.5 text-xs text-white/50">
                  {meta.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Datos de pago */}
      {selectedConfig && (
        <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/30 to-black p-4">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Realiza el pago a:
          </p>

          <div className="space-y-2.5">
            {Object.entries(selectedConfig.config).map(([key, value]) => {
              if (!value) return null;
              const labels: Record<string, string> = {
                phone: 'Teléfono',
                bank: 'Banco',
                cedula: 'Cédula',
                owner: 'Titular',
                email: 'Email',
              };
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-red-950/40 bg-black/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {labels[key] ?? key}
                    </p>
                    <p className="truncate text-sm font-bold text-white">
                      {value}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(value, key)}
                    className="shrink-0 rounded-lg border border-red-950/60 bg-black/40 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/70 transition hover:bg-red-950/30 hover:text-white"
                  >
                    {copied === key ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2.5 text-[11px] leading-relaxed text-amber-200">
            💡 <b>Importante:</b> transfiere{' '}
            <b className="text-white">{formatBs(totalBs)}</b> y guarda el
            comprobante. Lo necesitarás en el siguiente paso.
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] rounded-xl border border-red-950/60 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-red-950/30 hover:text-white"
        >
          ← Volver
        </button>
        <button
          type="button"
          onClick={() => selected && onNext(selected)}
          disabled={!selected}
          className={cn(
            'min-h-[52px] rounded-xl px-6 py-3.5 text-sm font-black uppercase tracking-wider transition',
            selected
              ? 'bg-gradient-to-r from-red-700 via-red-600 to-red-500 text-white shadow-lg shadow-red-900/40 hover:from-red-600 hover:to-red-500 active:scale-[0.98]'
              : 'cursor-not-allowed bg-white/5 text-white/30',
          )}
        >
          Ya pagué, continuar →
        </button>
      </div>
    </div>
  );
}