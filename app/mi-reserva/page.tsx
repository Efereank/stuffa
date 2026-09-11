'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ReservationTicketView from '@/components/booking/ReservationTicketView';
import type { ReservationTicket } from '@/lib/types';

export default function MiReservaPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<ReservationTicket | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase
      .rpc('find_reservation_by_phone_code', {
        p_phone: phone,
        p_code: code,
      })
      // RPC may return an array or an error-shaped object; use unknown and
      // normalize below.
      .returns<unknown>();

    if (rpcError || !data) {
      setError(
        'No encontramos ninguna reserva con esos datos. Verifica el código y el teléfono.',
      );
      setLoading(false);
      return;
    }

    // Normalize possible responses: array result, single object, or error-shaped
    // response from Supabase RPC.
    let ticket: ReservationTicket | null = null;

    if (Array.isArray(data)) {
      ticket = (data[0] ?? null) as ReservationTicket | null;
    } else if (typeof data === 'object' && data !== null && 'Error' in data) {
      ticket = null;
    } else {
      ticket = data as ReservationTicket | null;
    }

    if (!ticket) {
      setError(
        'No encontramos ninguna reserva con esos datos. Verifica el código y el teléfono.',
      );
      setLoading(false);
      return;
    }

    setReservation(ticket);
    setLoading(false);
  }

  function reset() {
    setReservation(null);
    setPhone('');
    setCode('');
    setError(null);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-white/50 hover:text-white/80"
          >
            ← Volver al inicio
          </Link>
          <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-emerald-400 sm:text-xs">
            Stuffa Disco &amp; Lounge
          </p>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            Buscar mi reserva
          </h1>
          <p className="mt-2 text-xs text-white/50 sm:text-sm">
            Ingresa tu número de teléfono y el código de reserva para recuperar
            tu QR.
          </p>
        </div>

        {!reservation ? (
          <form
            onSubmit={handleSearch}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/60">
                Teléfono / WhatsApp <span className="text-amber-400">*</span>
              </span>
              <input
                required
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+58 412 123 4567"
                className="min-h-[48px] w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/70"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/60">
                Código de reserva <span className="text-amber-400">*</span>
              </span>
              <input
                required
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="STF-A1B2C3"
                maxLength={12}
                className="min-h-[48px] w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-mono uppercase tracking-wider text-white placeholder:text-white/30 outline-none focus:border-amber-400/70"
              />
              <span className="mt-1 block text-[11px] text-white/40">
                Lo encuentras en tu código QR
              </span>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-sm font-bold uppercase tracking-wider text-black transition hover:from-amber-300 hover:to-amber-400 disabled:opacity-60"
            >
              {loading ? 'Buscando…' : 'Buscar reserva'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <ReservationTicketView
              reservation={reservation}
              onStatusChange={(s) =>
                setReservation((r) => (r ? { ...r, status: s } : r))
              }
            />
            <div className="text-center">
              <button
                type="button"
                onClick={reset}
                className="text-sm text-white/50 underline-offset-4 hover:underline"
              >
                Buscar otra reserva
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}