'use client';

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { cn, formatCurrency, formatLongDate, formatTime } from '@/lib/utils';
import type { ReservationTicket } from '@/lib/types';

const STATUS_LABEL: Record<ReservationTicket['status'], string> = {
  pending: 'Confirmada · Pendiente de llegada',
  checked_in: 'Check-in realizado',
  cancelled: 'Cancelada',
  no_show: 'No se presentó',
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export default function ReservationTicketView({
  reservation,
  onStatusChange,
}: {
  reservation: ReservationTicket;
  onStatusChange?: (newStatus: ReservationTicket['status']) => void;
}) {
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCancel =
    reservation.status === 'pending' && !!reservation.cancellation_token;

  const qrValue = SITE_URL
    ? `${SITE_URL}/reserva/${reservation.qr_token}`
    : `/reserva/${reservation.qr_token}`;

  async function handleCancel() {
    if (!reservation.cancellation_token) return;
    setCancelling(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc(
      'cancel_reservation_by_customer',
      { p_token: reservation.cancellation_token },
    );

    if (rpcError) {
      const msg = rpcError.message;
      if (msg.includes('ALREADY_CANCELLED'))
        setError('Esta reserva ya fue cancelada.');
      else if (msg.includes('ALREADY_CHECKED_IN'))
        setError('Ya se hizo check-in, no se puede cancelar.');
      else if (msg.includes('RESERVATION_NOT_FOUND'))
        setError('No encontramos la reserva.');
      else setError('No se pudo cancelar. Intenta de nuevo.');
      setCancelling(false);
      return;
    }

    setCancelling(false);
    setShowCancel(false);
    onStatusChange?.('cancelled');
  }

  return (
    <>
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-red-950/60 bg-neutral-950 shadow-2xl shadow-red-950/30">
        <div
          className={cn(
            'relative px-5 py-6 text-white sm:px-6',
            reservation.status === 'cancelled'
              ? 'bg-gradient-to-br from-neutral-700 to-neutral-800'
              : reservation.status === 'checked_in'
                ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900'
                : 'bg-gradient-to-br from-red-500 via-red-600 to-red-800',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-90 sm:text-[11px]">
                Stuffa Disco &amp; Lounge
              </p>
              <p className="mt-2 text-3xl font-black sm:text-4xl">
                {reservation.code}
              </p>
              <p className="mt-1 text-xs font-semibold opacity-90">
                {STATUS_LABEL[reservation.status]}
              </p>
            </div>
            <div className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">
              {reservation.zone_name}
            </div>
          </div>
        </div>

        {reservation.status !== 'cancelled' && (
          <div className="flex flex-col items-center gap-4 border-b border-dashed border-red-950/60 bg-red-950/5 px-5 py-7 sm:px-6 sm:py-8">
            {/* 🛡️ QR BLINDADO contra Force Dark Mode / Auto Dark Mode */}
            <div
              className="stuffa-protected w-full max-w-[230px] rounded-2xl bg-white p-4 shadow-lg shadow-red-950/40"
              style={{
                colorScheme: 'only light',
                isolation: 'isolate',
                forcedColorAdjust: 'none',
              }}
            >
              <QRCodeCanvas
                value={qrValue}
                size={256}
                level="M"
                marginSize={0}
                bgColor="#FFFFFF"
                fgColor="#000000"
                className="h-auto w-full"
                style={{
                  colorScheme: 'only light',
                  display: 'block',
                }}
              />
            </div>
            <p className="text-center text-xs text-white/50">
              Muestra este código QR en la entrada
            </p>
          </div>
        )}

        <dl className="space-y-3 px-5 py-5 text-sm sm:px-6 sm:py-6">
          <Row label="Titular" value={reservation.customer_name} />
          <Row label="Zona" value={reservation.zone_name} />
          <Row label="Mesa" value={reservation.table_code} />
          <Row label="Personas" value={String(reservation.party_size)} />
          <Row label="Fecha" value={formatLongDate(reservation.reservation_date)} />
          <Row label="Hora" value={formatTime(reservation.reservation_time)} />
          <Row
            label="Consumo mínimo"
            value={
              reservation.min_consumption_label
                ? `${formatCurrency(reservation.min_consumption)} · ${reservation.min_consumption_label}`
                : formatCurrency(reservation.min_consumption)
            }
            highlight
          />
          {reservation.notes && <Row label="Notas" value={reservation.notes} />}
        </dl>

        {canCancel && (
          <div className="border-t border-red-950/40 bg-red-950/5 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              className="min-h-[44px] w-full rounded-xl border border-red-900/60 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-950/40 hover:text-red-300"
            >
              Cancelar mi reserva
            </button>
          </div>
        )}

        {error && (
          <p className="border-t border-red-500/30 bg-red-950/30 px-5 py-3 text-xs text-red-300">
            {error}
          </p>
        )}
      </div>

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-sm space-y-4 rounded-t-3xl border border-red-900/50 bg-neutral-950 p-5 shadow-2xl shadow-red-950/40 sm:rounded-2xl">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
                Confirmar cancelación
              </p>
              <p className="mt-1 text-lg font-black text-white">
                ¿Cancelar tu reserva?
              </p>
              <p className="mt-2 text-sm text-white/60">
                Perderás tu mesa <b className="text-white">{reservation.table_code}</b> del{' '}
                {formatLongDate(reservation.reservation_date)}. Esta acción no
                se puede deshacer.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCancel(false)}
                disabled={cancelling}
                className="min-h-[48px] rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-60"
              >
                Mantener reserva
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="min-h-[48px] rounded-xl bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-60"
              >
                {cancelling ? 'Cancelando…' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-white/50">{label}</dt>
      <dd
        className={cn(
          'text-right',
          highlight ? 'font-bold text-yellow-400' : 'font-medium text-white',
        )}
      >
        {value}
      </dd>
    </div>
  );
}