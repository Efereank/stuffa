'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { EventDetail, CustomerGender } from '@/lib/types';

export interface Step1Data {
  name: string;
  cedula: string;
  email: string;
  phone: string;
  age: number;
  gender: CustomerGender;
  quantity: number;
  menCount: number;
  womenCount: number;
}

interface Step1DataProps {
  event: EventDetail;
  initialData?: Partial<Step1Data>;
  onNext: (data: Step1Data) => void;
  onBack?: () => void;
}

export default function Step1Data({
  event,
  initialData,
  onNext,
  onBack,
}: Step1DataProps) {
  const [form, setForm] = useState<Step1Data>({
    name: initialData?.name ?? '',
    cedula: initialData?.cedula ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    age: initialData?.age ?? 18,
    gender: initialData?.gender ?? 'M',
    quantity: initialData?.quantity ?? 1,
    menCount: initialData?.menCount ?? 1,
    womenCount: initialData?.womenCount ?? 0,
  });
  const [error, setError] = useState<string | null>(null);

  const available = event.ticket_types[0]?.available ?? 0;
  const maxQty = Math.min(10, available);

  function update<K extends keyof Step1Data>(key: K, value: Step1Data[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // Auto-ajuste de distribución H/M
      if (key === 'quantity') {
        const q = Number(value);
        if (next.menCount + next.womenCount !== q) {
          const menFirst = Math.min(next.menCount, q);
          next.menCount = menFirst;
          next.womenCount = q - menFirst;
        }
      }

      if (key === 'menCount') {
        const men = Math.min(Number(value), next.quantity);
        next.menCount = men;
        next.womenCount = next.quantity - men;
      }

      if (key === 'womenCount') {
        const women = Math.min(Number(value), next.quantity);
        next.womenCount = women;
        next.menCount = next.quantity - women;
      }

      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.name.trim().length < 3) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    if (form.cedula.trim().length < 5) {
      setError('Ingresa una cédula válida.');
      return;
    }
    if (form.phone.replace(/\D/g, '').length < 7) {
      setError('Ingresa un teléfono válido.');
      return;
    }
    if (form.age < 18) {
      setError('Debes ser mayor de 18 años.');
      return;
    }
    if (form.quantity < 1) {
      setError('Selecciona al menos 1 entrada.');
      return;
    }
    if (form.menCount + form.womenCount !== form.quantity) {
      setError('La distribución de hombres/mujeres no coincide.');
      return;
    }

    onNext(form);
  }

  const total = (event.ticket_types[0]?.price_usd ?? 0) * form.quantity;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white sm:text-2xl">
          Completa tus datos
        </h2>
        <p className="mt-1 text-xs text-white/50 sm:text-sm">
          Reserva tu entrada para la experiencia {event.name}
        </p>
        {available > 0 && available <= 30 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2">
            <span className="text-base animate-pulse">🔥</span>
            <p className="text-xs font-bold text-red-300">
              {available <= 10
                ? `¡Solo quedan ${available} entradas!`
                : `Quedan pocas — ${available} disponibles`}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo" required>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            autoComplete="name"
            className={inputClass}
            placeholder="Francisco Díaz"
          />
        </Field>

        <Field label="Cédula / Pasaporte" required>
          <input
            required
            value={form.cedula}
            onChange={(e) => update('cedula', e.target.value)}
            autoComplete="off"
            className={inputClass}
            placeholder="V-31279765"
          />
        </Field>

        <Field label="Edad" required>
          <input
            required
            type="number"
            min={18}
            max={99}
            value={form.age}
            onChange={(e) => update('age', Number(e.target.value) || 18)}
            className={inputClass}
          />
        </Field>

        <Field label="Género" required>
          <div className="grid grid-cols-3 gap-2">
            {(['M', 'F', 'O'] as CustomerGender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => update('gender', g)}
                className={cn(
                  'rounded-xl border py-3 text-sm font-bold uppercase transition',
                  form.gender === g
                    ? 'border-red-500 bg-red-600/30 text-white'
                    : 'border-red-950/60 bg-black/40 text-white/60 hover:border-red-800',
                )}
              >
                {g === 'M' ? 'Masc.' : g === 'F' ? 'Fem.' : 'Otro'}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Correo electrónico">
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            autoComplete="email"
            inputMode="email"
            className={inputClass}
            placeholder="tucorreo@email.com"
          />
        </Field>

        <Field label="Teléfono / WhatsApp" required>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            className={inputClass}
            placeholder="+58 412 505 2658"
          />
        </Field>
      </div>

      {/* Cantidad + Distribución */}
      <div className="rounded-2xl border border-red-950/60 bg-black/40 p-4">
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
            Cantidad de entradas <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update('quantity', Math.max(1, form.quantity - 1))}
              disabled={form.quantity <= 1}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold transition',
                form.quantity > 1
                  ? 'border-red-900/60 bg-red-950/30 text-white hover:bg-red-900/40 active:scale-95'
                  : 'cursor-not-allowed border-white/5 text-white/20',
              )}
            >
              −
            </button>

            <div className="flex flex-1 items-center justify-center rounded-xl border border-red-950/60 bg-black/50 px-4 py-2.5">
              <span className="text-2xl font-black text-white">{form.quantity}</span>
              <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                {form.quantity === 1 ? 'entrada' : 'entradas'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => update('quantity', Math.min(maxQty, form.quantity + 1))}
              disabled={form.quantity >= maxQty}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold transition',
                form.quantity < maxQty
                  ? 'border-red-900/60 bg-red-950/30 text-white hover:bg-red-900/40 active:scale-95'
                  : 'cursor-not-allowed border-white/5 text-white/20',
              )}
            >
              +
            </button>
          </div>
          <p className="mt-1 text-[11px] text-white/40">
            Disponibles: {available} · Máximo {maxQty} por compra
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Hombres" required>
            <input
              type="number"
              min={0}
              max={form.quantity}
              value={form.menCount}
              onChange={(e) => update('menCount', Number(e.target.value) || 0)}
              className={inputClass}
            />
          </Field>

          <Field label="Mujeres" required>
            <input
              type="number"
              min={0}
              max={form.quantity}
              value={form.womenCount}
              onChange={(e) => update('womenCount', Number(e.target.value) || 0)}
              className={inputClass}
            />
          </Field>
        </div>

        {form.menCount + form.womenCount === form.quantity && (
          <p className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
            ✓ Distribución correcta
          </p>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/40 to-black p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
            Total a pagar
          </p>
          <p className="text-2xl font-black text-white sm:text-3xl">
            ${total.toFixed(2)}
          </p>
        </div>
        <span className="text-3xl">🎫</span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="min-h-[48px] rounded-xl border border-red-950/60 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-red-950/30 hover:text-white"
          >
            ← Volver
          </button>
        ) : (
          <div />
        )}
        <button
          type="submit"
          className="min-h-[52px] rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 active:scale-[0.98]"
        >
          Continuar al pago →
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full min-h-[48px] rounded-xl border border-red-950/60 bg-black/40 px-4 py-3 text-sm text-white ' +
  'placeholder:text-white/30 outline-none transition ' +
  'focus:border-red-500/70 focus:bg-black/60 focus:ring-2 focus:ring-red-500/30 ' +
  '[color-scheme:dark]';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}