'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { PaymentConfig, PaymentMethod } from '@/lib/types';

interface PaymentConfigFormProps {
  initial: PaymentConfig[];
}

interface LocalConfig {
  method: PaymentMethod;
  is_active: boolean;
  config: Record<string, string>;
}

const METHOD_META: Record<
  PaymentMethod,
  {
    label: string;
    icon: string;
    description: string;
    fields: { key: string; label: string; placeholder: string; required?: boolean }[];
  }
> = {
  pago_movil: {
    label: 'Pago Móvil',
    icon: '📱',
    description: 'Transferencia desde la app bancaria del cliente',
    fields: [
      { key: 'phone', label: 'Teléfono', placeholder: '0414XXXXXXX', required: true },
      { key: 'bank', label: 'Banco', placeholder: 'Banco Nacional de Crédito', required: true },
      { key: 'cedula', label: 'Cédula', placeholder: 'V-12345678', required: true },
      { key: 'owner', label: 'Titular', placeholder: 'Nombre del titular', required: true },
    ],
  },
  zelle: {
    label: 'Zelle',
    icon: '💳',
    description: 'Transferencia bancaria en dólares (USA)',
    fields: [
      { key: 'email', label: 'Email Zelle', placeholder: 'pagos@stuffa.com', required: true },
      { key: 'owner', label: 'Titular', placeholder: 'Nombre del titular', required: true },
    ],
  },
  binance: {
    label: 'Binance Pay',
    icon: '🪙',
    description: 'Pago con criptomonedas',
    fields: [
      { key: 'binance_id', label: 'Binance ID', placeholder: '123456789', required: true },
      { key: 'owner', label: 'Titular', placeholder: 'Nombre del titular', required: true },
    ],
  },
};

export default function PaymentConfigForm({ initial }: PaymentConfigFormProps) {
  const [configs, setConfigs] = useState<LocalConfig[]>(() => {
    // Ordenar por orden de METHOD_META
    const order: PaymentMethod[] = ['pago_movil', 'zelle', 'binance'];
    return order.map((method) => {
      const found = initial.find((c) => c.method === method);
      return {
        method,
        is_active: found ? (found as any).is_active ?? true : false,
        config: (found?.config ?? {}) as Record<string, string>,
      };
    });
  });

  const [saving, setSaving] = useState<PaymentMethod | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function updateField(
    method: PaymentMethod,
    key: string,
    value: string,
  ) {
    setConfigs((prev) =>
      prev.map((c) =>
        c.method === method
          ? { ...c, config: { ...c.config, [key]: value } }
          : c,
      ),
    );
  }

  function toggleActive(method: PaymentMethod) {
    setConfigs((prev) =>
      prev.map((c) =>
        c.method === method ? { ...c, is_active: !c.is_active } : c,
      ),
    );
  }

  async function save(method: PaymentMethod) {
    const cfg = configs.find((c) => c.method === method);
    if (!cfg) return;

    setSaving(method);
    setMsg(null);

    const supabase = createClient();

    // Upsert
    const { error } = await supabase
      .from('payment_configs')
      .upsert(
        {
          method: cfg.method,
          is_active: cfg.is_active,
          config: cfg.config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'method' },
      );

    setSaving(null);

    if (error) {
      setMsg(`❌ ${error.message}`);
    } else {
      setMsg(`✅ ${METHOD_META[method].label} guardado`);
    }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <p
          className={cn(
            'rounded-lg border px-3 py-2 text-xs',
            msg.startsWith('✅')
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300',
          )}
        >
          {msg}
        </p>
      )}

      {configs.map((cfg) => {
        const meta = METHOD_META[cfg.method];
        const isSaving = saving === cfg.method;

        return (
          <div
            key={cfg.method}
            className={cn(
              'rounded-2xl border bg-black/40 p-5 transition',
              cfg.is_active
                ? 'border-red-500/40 bg-gradient-to-br from-red-950/20 to-black'
                : 'border-red-950/60',
            )}
          >
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{meta.icon}</span>
                <div>
                  <h2 className="text-lg font-black text-white">
                    {meta.label}
                  </h2>
                  <p className="mt-0.5 text-xs text-white/50">
                    {meta.description}
                  </p>
                </div>
              </div>

              {/* Toggle activo */}
              <button
                type="button"
                onClick={() => toggleActive(cfg.method)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition',
                  cfg.is_active
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/10 bg-black/40 text-white/40',
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    cfg.is_active ? 'bg-emerald-400' : 'bg-white/30',
                  )}
                />
                {cfg.is_active ? 'Activo' : 'Inactivo'}
              </button>
            </div>

            {/* Campos */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {meta.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/50">
                    {field.label}{' '}
                    {field.required && <span className="text-red-500">*</span>}
                  </span>
                  <input
                    type="text"
                    value={cfg.config[field.key] ?? ''}
                    onChange={(e) =>
                      updateField(cfg.method, field.key, e.target.value)
                    }
                    placeholder={field.placeholder}
                    className="w-full min-h-[44px] rounded-xl border border-red-950/60 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-red-500/70"
                  />
                </label>
              ))}
            </div>

            {/* Guardar */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => save(cfg.method)}
                disabled={isSaving}
                className={cn(
                  'min-h-[44px] rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition',
                  isSaving
                    ? 'cursor-wait bg-white/10 text-white/40'
                    : 'bg-gradient-to-r from-red-700 via-red-600 to-red-500 text-white shadow-lg shadow-red-900/40 hover:from-red-600 hover:to-red-500',
                )}
              >
                {isSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        );
      })}

      <div className="rounded-2xl border border-red-950/60 bg-red-950/5 p-4 text-xs text-white/60">
        <p className="mb-1 font-bold text-white/80">💡 Notas:</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>
            Solo los métodos <b>activos</b> aparecen en el flujo de compra del
            cliente.
          </li>
          <li>
            Los datos que ingreses aquí se muestran tal cual al cliente cuando
            elige el método.
          </li>
          <li>
            Si desactivas un método, los clientes ya no podrán pagar con él,
            pero las órdenes anteriores siguen visibles.
          </li>
        </ul>
      </div>
    </div>
  );
}