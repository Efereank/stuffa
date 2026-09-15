'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/Footer';
import OrderDetailView from '@/components/purchase/OrderDetailView';
import type { OrderDetail } from '@/lib/types';

export default function MiOrdenPage() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase
      .rpc('find_order_by_code_phone', {
        p_code: code,
        p_phone: phone,
      })
      .maybeSingle<OrderDetail>();

    setLoading(false);

    if (rpcError || !data) {
      setError(
        'No encontramos ninguna orden con esos datos. Verifica el código y el teléfono.',
      );
      return;
    }

    setOrder(data);
  }

  return (
    <>
      <SiteHeader />
      <main className="pt-24 sm:pt-28">
        <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500 sm:text-xs">
              Stuffa Disco &amp; Lounge
            </p>
            <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              Buscar mi orden
            </h1>
            <p className="mx-auto mt-2 max-w-md text-xs text-white/50 sm:text-sm">
              Ingresa tu código de orden y teléfono para consultar el estado de
              tu compra.
            </p>
          </div>

          {!order ? (
            <form
              onSubmit={handleSearch}
              className="space-y-4 rounded-2xl border border-red-950/60 bg-black/60 p-5 sm:p-6"
            >
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
                  Código de orden <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="STF-A1B2C3"
                  maxLength={12}
                  className="w-full min-h-[48px] rounded-xl border border-red-950/60 bg-black/40 px-4 py-3 font-mono text-sm uppercase tracking-wider text-white placeholder:text-white/30 outline-none focus:border-red-500/70"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
                  Teléfono <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+58 412 505 2658"
                  className="w-full min-h-[48px] rounded-xl border border-red-950/60 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-red-500/70"
                />
              </label>

              {error && (
                <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 disabled:opacity-60"
              >
                {loading ? 'Buscando…' : 'Buscar orden'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <OrderDetailView order={order} />
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOrder(null);
                    setCode('');
                    setPhone('');
                    setError(null);
                  }}
                  className="text-sm text-white/50 underline-offset-4 hover:text-white hover:underline"
                >
                  Buscar otra orden
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}