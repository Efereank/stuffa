'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Credenciales incorrectas.');
      setLoading(false);
      return;
    }

    router.replace('/admin');
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-8">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.25),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(153,27,27,0.15),_transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(220,38,38,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="relative mx-auto h-14 w-44 sm:h-16 sm:w-52">
            <Image
              src="/stuffa-logo.png"
              alt="Stuffa Disco & Lounge"
              fill
              priority
              sizes="208px"
              className="object-contain"
            />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.4em] text-red-500">
            Panel Administrativo
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-red-950/60 bg-black/60 p-6 shadow-2xl shadow-red-950/30 backdrop-blur-xl sm:p-7"
        >
          <div>
            <h1 className="text-xl font-black text-white">Acceso staff</h1>
            <p className="mt-1 text-xs text-white/50">
              Ingresa con tu cuenta autorizada
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Correo electrónico
            </span>
            <input
              type="email"
              required
              placeholder="correo@stuffa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full min-h-[48px] rounded-xl border border-red-950/60 bg-black/40 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-red-500/70 focus:bg-black/60 focus:ring-2 focus:ring-red-500/30"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Contraseña
            </span>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full min-h-[48px] rounded-xl border border-red-950/60 bg-black/40 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-red-500/70 focus:bg-black/60 focus:ring-2 focus:ring-red-500/30"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-[52px] w-full rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar al panel'}
          </button>

          <p className="pt-2 text-center text-[10px] text-white/30">
            ¿Problemas para entrar? Contacta al administrador.
          </p>
        </form>
      </div>
    </main>
  );
}