'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import QrScannerModal from './QrScannerModal';
import EditReservationModal from './EditReservationModal';
import { cn, formatTime } from '@/lib/utils';
import type { AdminReservation, ReservationStatus } from '@/lib/types';

const RESERVATION_SELECT = `
  id, code, customer_name, customer_phone, customer_email,
  party_size, reservation_date, reservation_time, status,
  qr_token, notes, checked_in_at,
  tables ( code, zones ( name ) )
`;

const STATUS_META: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  },
  checked_in: {
    label: 'En local',
    className: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-white/10 text-white/50 border-white/20',
  },
  no_show: {
    label: 'No show',
    className: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
};

/**
 * Extrae el token de reserva de un QR que puede contener:
 * - Una URL: https://dominio.com/reserva/{uuid}
 * - Un UUID pelado: abc-123-def-456
 * - Un código de reserva: STF-XXXXXX
 */
function extractToken(raw: string): {
  value: string;
  field: 'qr_token' | 'code' | 'unknown';
} {
  const trimmed = raw.trim();
  if (!trimmed) return { value: '', field: 'unknown' };

  // 1. URL con /reserva/{uuid}
  const reservaMatch = trimmed.match(
    /reserva\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  if (reservaMatch?.[1]) {
    return { value: reservaMatch[1], field: 'qr_token' };
  }

  // 2. Cualquier UUID en el string
  const uuidMatch = trimmed.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  if (uuidMatch) {
    return { value: uuidMatch[0], field: 'qr_token' };
  }

  // 3. Código de reserva STF-XXXXXX
  const codeMatch = trimmed.match(/STF-[A-Z0-9]{6}/i);
  if (codeMatch) {
    return { value: codeMatch[0].toUpperCase(), field: 'code' };
  }

  // 4. Fallback: devolvemos el raw por si acaso
  return { value: trimmed, field: 'unknown' };
}

interface AdminDashboardProps {
  initialReservations: AdminReservation[];
  date: string;
}

export default function AdminDashboard({
  initialReservations,
  date,
}: AdminDashboardProps) {
  const supabaseRef = useRef(createClient());
  const [reservations, setReservations] = useState(initialReservations);
  const [filter, setFilter] = useState<ReservationStatus | 'all'>('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminReservation | null>(null);
  const [live, setLive] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error } = await supabaseRef.current
      .from('reservations')
      .select(RESERVATION_SELECT)
      .eq('reservation_date', date)
      .order('reservation_time', { ascending: true })
      .returns<AdminReservation[]>();

    if (!error && data) setReservations(data);
  }, [date]);

  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`admin-reservations-${date}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => void refresh(),
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [date, refresh]);

  async function updateStatus(id: string, status: ReservationStatus) {
    await supabaseRef.current
      .from('reservations')
      .update({
        status,
        checked_in_at:
          status === 'checked_in' ? new Date().toISOString() : null,
      })
      .eq('id', id);
    void refresh();
  }

  const handleScan = useCallback(
    async (rawValue: string): Promise<string> => {
      // 🔍 LOG DE DIAGNÓSTICO — Abre F12 → Console para verlo
      console.log('[Scanner] QR detectado:', rawValue);

      const { value, field } = extractToken(rawValue);

      console.log('[Scanner] Extraído:', { value, field });

      if (!value || field === 'unknown') {
        return '❌ QR inválido o no reconocido.';
      }

      // Actualizamos según el campo encontrado
      const updateData = {
        status: 'checked_in' as const,
        checked_in_at: new Date().toISOString(),
      };

      const query = supabaseRef.current
        .from('reservations')
        .update(updateData)
        .eq(field, value)
        .select('code, customer_name')
        .maybeSingle<{ code: string; customer_name: string }>();

      const { data, error } = await query;

      if (error) {
        console.error('[Scanner] Error de Supabase:', error);
        return `❌ ${error.message}`;
      }

      if (!data) {
        console.warn('[Scanner] Sin resultados para:', { field, value });
        return '❌ No existe una reserva con este código.';
      }

      void refresh();
      return `✅ ${data.customer_name} — ${data.code}`;
    },
    [refresh],
  );

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? reservations
        : reservations.filter((r) => r.status === filter),
    [reservations, filter],
  );

  const stats = useMemo(() => {
    const base = {
      total: reservations.length,
      pending: 0,
      checked_in: 0,
      no_show: 0,
      guests: 0,
    };
    for (const r of reservations) {
      if (r.status === 'pending') base.pending += 1;
      if (r.status === 'checked_in') {
        base.checked_in += 1;
        base.guests += r.party_size;
      }
      if (r.status === 'no_show') base.no_show += 1;
    }
    return base;
  }, [reservations]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span
            className={cn(
              'h-2.5 w-2.5 shrink-0 rounded-full',
              live ? 'animate-pulse bg-emerald-400' : 'bg-white/30',
            )}
          />
          <span className="text-white/60">
            {live ? 'Tiempo real activo' : 'Conectando…'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:from-red-600 hover:to-red-500 sm:w-auto"
        >
          📷 Escanear QR
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <StatCard label="Reservas" value={stats.total} />
        <StatCard label="Pendientes" value={stats.pending} tone="amber" />
        <StatCard label="En local" value={stats.checked_in} tone="emerald" />
        <StatCard label="Personas" value={stats.guests} tone="sky" />
      </div>

      <div className="-mx-3 overflow-x-auto px-3 no-scrollbar sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {(
            ['all', 'pending', 'checked_in', 'no_show', 'cancelled'] as const
          ).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition',
                filter === s
                  ? 'border-red-500 bg-red-600/20 text-red-300'
                  : 'border-white/10 text-white/50 hover:bg-white/5',
              )}
            >
              {s === 'all' ? 'Todas' : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-white/40">
            Sin reservas para este filtro.
          </p>
        )}

        {filtered.map((r) => (
          <article
            key={r.id}
            className="flex flex-col gap-3 rounded-2xl border border-red-950/60 bg-neutral-950/80 p-4 lg:flex-row lg:items-center"
          >
            <div className="flex items-center justify-between gap-3 lg:min-w-[120px] lg:flex-col lg:items-start lg:justify-start">
              <span className="text-lg font-bold text-white lg:text-xl">
                {formatTime(r.reservation_time)}
              </span>
              <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-400">
                {r.tables?.code ?? '—'}
              </span>
            </div>

            <div className="flex-1 space-y-0.5">
              <p className="truncate font-semibold text-white">
                {r.customer_name}
              </p>
              <p className="text-xs text-white/50 sm:text-sm">
                {r.party_size} pers. · {r.customer_phone}
              </p>
              <p className="truncate text-xs text-white/30">
                {r.tables?.zones?.name ?? ''} · Código: {r.code}
                {r.notes ? ` · ${r.notes}` : ''}
              </p>
            </div>

            <span
              className={cn(
                'inline-flex w-fit self-start rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide lg:self-center',
                STATUS_META[r.status].className,
              )}
            >
              {STATUS_META[r.status].label}
            </span>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <ActionButton onClick={() => setEditing(r)} tone="sky">
                ✏️ Editar
              </ActionButton>

              {r.status !== 'checked_in' && (
                <ActionButton
                  onClick={() => updateStatus(r.id, 'checked_in')}
                  tone="emerald"
                >
                  Check-in
                </ActionButton>
              )}
              {r.status === 'pending' && (
                <>
                  <ActionButton
                    onClick={() => updateStatus(r.id, 'no_show')}
                    tone="red"
                  >
                    No show
                  </ActionButton>
                  <ActionButton
                    onClick={() => updateStatus(r.id, 'cancelled')}
                    tone="ghost"
                  >
                    Cancelar
                  </ActionButton>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onToken={handleScan}
      />

      {editing && (
        <EditReservationModal
          reservation={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            void refresh();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'amber' | 'emerald' | 'sky';
}) {
  const tones = {
    neutral: 'text-white',
    amber: 'text-red-400',
    emerald: 'text-emerald-400',
    sky: 'text-sky-400',
  } as const;

  return (
    <div className="rounded-2xl border border-red-950/60 bg-neutral-950/80 p-3 sm:p-4">
      <p className="text-[10px] uppercase tracking-wide text-white/40 sm:text-[11px]">
        {label}
      </p>
      <p className={cn('mt-1 text-xl font-black sm:text-2xl', tones[tone])}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: 'emerald' | 'red' | 'ghost' | 'sky';
}) {
  const tones = {
    emerald: 'border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10',
    red: 'border-red-500/40 text-red-300 hover:bg-red-500/10',
    ghost: 'border-white/15 text-white/60 hover:bg-white/5',
    sky: 'border-sky-400/40 text-sky-300 hover:bg-sky-400/10',
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-[40px] rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs',
        tones[tone],
      )}
    >
      {children}
    </button>
  );
}