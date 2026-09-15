'use client';

import { useCallback, useEffect, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { createClient } from '@/lib/supabase/client';
import CheckInResult, { type ScanResult } from './CheckInResult';
import { cn } from '@/lib/utils';

interface CheckInApiResponse {
  status:
    | 'ok'
    | 'already_checked_in'
    | 'not_verified'
    | 'not_found';
  code?: string;
  customer_name?: string;
  quantity?: number;
  event_name?: string;
  checked_in_at?: string;
  current_status?: string;
}

/** Extrae el token QR de un texto que puede ser URL o UUID */
function extractQrToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // URL tipo https://dominio.com/orden/{uuid}
  const urlMatch = trimmed.match(
    /orden\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  if (urlMatch?.[1]) return urlMatch[1];

  // UUID directo
  const uuidMatch = trimmed.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  if (uuidMatch) return uuidMatch[0];

  return trimmed;
}

export default function CheckInScanner() {
  const [paused, setPaused] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [stats, setStats] = useState({ scans: 0, ok: 0, warnings: 0, errors: 0 });

  const handleScan = useCallback(
    async (detected: { rawValue: string }[]) => {
      const value = detected[0]?.rawValue;
      if (!value || processing || paused) return;

      const token = extractQrToken(value);
      if (!token) return;

      setProcessing(true);
      setPaused(true);

      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('admin_check_in', { p_qr_token: token })
        .single<CheckInApiResponse>();

      if (error || !data) {
        setLastResult({
          kind: 'error',
          message: 'Error al escanear. Intenta de nuevo.',
        });
        setStats((s) => ({
          ...s,
          scans: s.scans + 1,
          errors: s.errors + 1,
        }));
      } else {
        switch (data.status) {
          case 'ok':
            setLastResult({
              kind: 'success',
              message: '¡Bienvenido!',
              code: data.code ?? '',
              customerName: data.customer_name ?? '',
              quantity: data.quantity ?? 0,
              eventName: data.event_name ?? '',
            });
            setStats((s) => ({
              ...s,
              scans: s.scans + 1,
              ok: s.ok + 1,
            }));
            break;

          case 'already_checked_in':
            setLastResult({
              kind: 'warning',
              message: 'Ya fue escaneado antes',
              code: data.code ?? '',
              customerName: data.customer_name ?? '',
              quantity: data.quantity ?? 0,
              eventName: data.event_name ?? '',
              extra: data.checked_in_at
                ? `Check-in previo: ${new Date(data.checked_in_at).toLocaleTimeString('es-VE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}`
                : undefined,
            });
            setStats((s) => ({
              ...s,
              scans: s.scans + 1,
              warnings: s.warnings + 1,
            }));
            break;

          case 'not_verified':
            setLastResult({
              kind: 'error',
              message: 'Pago no verificado',
              code: data.code ?? '',
              customerName: data.customer_name ?? '',
              extra: `Estado actual: ${data.current_status ?? 'desconocido'}`,
            });
            setStats((s) => ({
              ...s,
              scans: s.scans + 1,
              errors: s.errors + 1,
            }));
            break;

          case 'not_found':
            setLastResult({
              kind: 'error',
              message: 'QR no reconocido',
              extra: 'Este QR no corresponde a ninguna orden.',
            });
            setStats((s) => ({
              ...s,
              scans: s.scans + 1,
              errors: s.errors + 1,
            }));
            break;
        }
      }

      setProcessing(false);

      // Cooldown: 3s para éxitos/avisos, 2s para errores
      const wait = data?.status === 'ok' || data?.status === 'already_checked_in' ? 3000 : 2000;
      window.setTimeout(() => {
        setPaused(false);
        setLastResult(null);
      }, wait);
    },
    [processing, paused],
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox label="Escaneos" value={stats.scans} tone="neutral" />
        <StatBox label="OK" value={stats.ok} tone="emerald" />
        <StatBox label="Avisos" value={stats.warnings} tone="amber" />
        <StatBox label="Errores" value={stats.errors} tone="red" />
      </div>

      {/* Scanner */}
      <div className="relative overflow-hidden rounded-2xl border border-red-950/60 bg-black shadow-2xl">
        <div className="relative aspect-square w-full sm:aspect-[4/3]">
          <Scanner
            onScan={handleScan}
            onError={(err) => console.error('[scanner]', err)}
            paused={paused}
            constraints={{ facingMode: 'environment' }}
            styles={{
              container: { width: '100%', height: '100%' },
              video: { objectFit: 'cover' },
            }}
          />

          {/* Overlay cuando procesa */}
          {processing && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <span className="h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                  Procesando…
                </span>
              </div>
            </div>
          )}

          {/* Marco visual (no bloquea) */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="relative h-2/3 w-2/3 rounded-3xl border-2 border-red-500/40">
              {/* Esquinas */}
              <Corner className="left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl" />
              <Corner className="right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl" />
              <Corner className="left-0 bottom-0 border-l-4 border-b-4 rounded-bl-3xl" />
              <Corner className="right-0 bottom-0 border-r-4 border-b-4 rounded-br-3xl" />
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="border-t border-red-950/60 bg-black/80 px-4 py-3 text-center">
          <p className="text-xs text-white/60">
            {paused
              ? 'Esperando para el próximo escaneo…'
              : 'Apunta la cámara al código QR del cliente'}
          </p>
        </div>
      </div>

      {/* Último resultado */}
      {lastResult && <CheckInResult result={lastResult} />}
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      className={cn(
        'absolute h-8 w-8 border-red-500',
        className,
      )}
    />
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'emerald' | 'amber' | 'red';
}) {
  const tones = {
    neutral: 'text-white',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  } as const;

  return (
    <div className="rounded-xl border border-red-950/60 bg-black/40 p-2.5 text-center sm:p-3">
      <p className="text-[9px] uppercase tracking-wide text-white/40 sm:text-[10px]">
        {label}
      </p>
      <p className={cn('mt-1 text-lg font-black sm:text-xl', tones[tone])}>
        {value}
      </p>
    </div>
  );
}