'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translateRpcError, formatCurrency, cn } from '@/lib/utils';
import type { MapTable } from '@/lib/types';

interface BookingFormProps {
  table: MapTable;
  date: string;
  onBack: () => void;
  initialPartySize?: number;
}

interface FormState {
  name: string;
  phone: string;
  partySize: number;
  time: string;
  notes: string;
}

interface ApiSuccess {
  success: true;
  qr_token: string;
  code: string;
}

interface ApiError {
  error: string;
}

/** Horario permitido para reservar (formato HH:MM) */
const MIN_TIME = '22:00';
const MAX_TIME = '23:00';

export default function BookingForm({
  table,
  date,
  onBack,
  initialPartySize,
}: BookingFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    partySize: Math.min(initialPartySize ?? 2, table.capacity),
    time: '22:30',
    notes: '',
  });
  const [privacy, setPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [website, setWebsite] = useState('');
  const startedAtRef = useRef<number>(Date.now());

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!privacy) {
      setError('Debes aceptar el aviso de privacidad.');
      return;
    }
    if (form.partySize < 1) {
      setError('El número de personas debe ser al menos 1.');
      return;
    }
    if (form.partySize > table.capacity) {
      setError(
        `Esta mesa admite máximo ${table.capacity} personas. Elige otra mesa o reduce el número.`,
      );
      return;
    }

    // 🕐 Validación de horario
    if (form.time < MIN_TIME || form.time > MAX_TIME) {
      setError(`El horario de reserva es de 10:00 PM a 11:00 PM.`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: table.id,
          date,
          name: form.name,
          phone: form.phone,
          partySize: form.partySize,
          time: form.time,
          notes: form.notes,
          privacyAccepted: true,
          website,
          startedAt: startedAtRef.current,
        }),
      });

      const data = (await res.json()) as ApiSuccess | ApiError;

      if (!res.ok || 'error' in data) {
        const errMsg = 'error' in data ? data.error : 'UNKNOWN';
        setError(translateRpcError(errMsg));
        setSubmitting(false);
        return;
      }

      router.push(`/reserva/${data.qr_token}`);
    } catch {
      setError('No se pudo conectar. Revisa tu internet e intenta de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-red-500/40 bg-red-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500 sm:text-xs">
            {table.zone_name}
          </p>
          <p className="text-lg font-black text-white sm:text-xl">{table.code}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/70 sm:flex-col sm:items-end sm:gap-0.5 sm:text-sm">
          <p>Hasta {table.capacity} personas</p>
          <p className="font-bold text-yellow-400">
            Mín. {formatCurrency(table.min_consumption)}
          </p>
          {table.min_consumption_label && (
            <p className="text-[11px] text-white/50">
              {table.min_consumption_label}
            </p>
          )}
        </div>
      </div>

      {/* 🛡️ Honeypot */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
      >
        <label>
          No completes este campo
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo" required>
          <input
            required
            minLength={3}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            autoComplete="name"
            className={inputClass}
            placeholder="Ana Martínez"
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
            placeholder="+58 412 123 4567"
          />
        </Field>

        <Field label="Número de personas" required>
          <input
            required
            type="number"
            min={1}
            max={table.capacity}
            step={1}
            inputMode="numeric"
            value={form.partySize}
            onChange={(e) =>
              update('partySize', e.target.value === '' ? 0 : Number(e.target.value))
            }
            onBlur={() => {
              if (form.partySize < 1) update('partySize', 1);
              if (form.partySize > table.capacity)
                update('partySize', table.capacity);
            }}
            className={inputClass}
            placeholder={`1 - ${table.capacity}`}
          />
          <span className="mt-1 block text-[11px] text-white/40">
            Máximo {table.capacity} personas
          </span>
        </Field>

        <Field label="Hora de llegada" required>
          <input
            required
            type="time"
            min={MIN_TIME}
            max={MAX_TIME}
            value={form.time}
            onChange={(e) => update('time', e.target.value)}
            onBlur={() => {
              if (form.time < MIN_TIME) update('time', MIN_TIME);
              if (form.time > MAX_TIME) update('time', MAX_TIME);
            }}
            className={inputClass}
          />
          <span className="mt-1 block text-[11px] text-white/40">
            Entre 10:00 PM y 11:00 PM
          </span>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Notas (opcional)">
            <input
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              maxLength={200}
              className={inputClass}
              placeholder="Cumpleaños, botella en específico…"
            />
          </Field>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-red-950/60 bg-red-950/5 p-3.5 transition hover:border-red-800/60">
        <input
          type="checkbox"
          checked={privacy}
          onChange={(e) => setPrivacy(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-red-500"
        />
        <span className="text-xs leading-relaxed text-white/70">
          Acepto el{' '}
          <Link
            href="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 underline underline-offset-2 hover:text-red-300"
          >
            aviso de privacidad
          </Link>{' '}
          y autorizo el tratamiento de mis datos para gestionar mi reserva.
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] rounded-xl border border-red-950/60 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-red-950/30 hover:text-white"
        >
          Elegir otra mesa
        </button>
        <button
          type="submit"
          disabled={submitting || !privacy}
          className={cn(
            'min-h-[52px] rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
          )}
        >
          {submitting ? 'Confirmando…' : 'Confirmar reserva'}
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