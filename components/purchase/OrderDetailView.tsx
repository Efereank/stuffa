'use client';

import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { cn, formatBs, formatCurrency, formatLongDate, formatTime } from '@/lib/utils';
import type { OrderDetail, OrderStatus } from '@/lib/types';

const STATUS_META: Record<OrderStatus, { label: string; className: string; bg: string }> = {
  pending: {
    label: 'Pendiente de pago',
    className: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
    bg: 'from-amber-500 via-amber-600 to-amber-800',
  },
  payment_uploaded: {
    label: 'Pago en verificación',
    className: 'border-sky-500/40 bg-sky-950/30 text-sky-300',
    bg: 'from-sky-500 via-sky-600 to-sky-800',
  },
  verified: {
    label: 'Verificado · Listo para entrar',
    className: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
    bg: 'from-emerald-500 via-emerald-600 to-emerald-800',
  },
  rejected: {
    label: 'Pago rechazado',
    className: 'border-red-500/40 bg-red-950/30 text-red-300',
    bg: 'from-red-500 via-red-600 to-red-800',
  },
  checked_in: {
    label: 'Check-in realizado',
    className: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
    bg: 'from-emerald-600 via-emerald-700 to-emerald-900',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'border-white/20 bg-white/5 text-white/50',
    bg: 'from-neutral-600 via-neutral-700 to-neutral-800',
  },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export default function OrderDetailView({ order }: { order: OrderDetail }) {
  const qrValue = SITE_URL
    ? `${SITE_URL}/orden/${order.qr_token}`
    : `/orden/${order.qr_token}`;

  const meta = STATUS_META[order.status];
  const showQr = order.status === 'verified' || order.status === 'checked_in';

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-red-950/60 bg-neutral-950 shadow-2xl shadow-red-950/30">
      {/* Header */}
      <div className="relative px-5 py-6 text-white sm:px-6">
        <div className={cn('absolute inset-0 bg-gradient-to-br', meta.bg)} />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-90 sm:text-[11px]">
              Stuffa Disco &amp; Lounge
            </p>
            <p className="mt-2 text-3xl font-black sm:text-4xl">{order.code}</p>
            <p className="mt-1 text-xs font-semibold opacity-90">{meta.label}</p>
          </div>
          <div className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">
            {order.ticket_type.name}
          </div>
        </div>
      </div>

      {/* Estado */}
      <div className={cn('border-b px-5 py-3 sm:px-6', meta.className)}>
        <p className="text-xs font-bold uppercase tracking-widest">
          {meta.label}
        </p>
      </div>

      {/* QR */}
      {showQr && (
        <div className="flex flex-col items-center gap-4 border-b border-dashed border-red-950/60 bg-red-950/5 px-5 py-7 sm:px-6 sm:py-8">
          <div className="w-full max-w-[230px] rounded-2xl bg-white p-4 shadow-lg shadow-red-950/40">
            <QRCodeSVG
              value={qrValue}
              size={256}
              level="M"
              marginSize={0}
              bgColor="#FFFFFF"
              fgColor="#000000"
              className="h-auto w-full"
            />
          </div>
          <p className="text-center text-xs text-white/50">
            Muestra este QR en la entrada
          </p>
        </div>
      )}

      {/* Rechazo */}
      {order.status === 'rejected' && order.rejection_reason && (
        <div className="border-b border-red-500/30 bg-red-950/30 px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
            Motivo del rechazo
          </p>
          <p className="mt-1 text-sm text-red-200">{order.rejection_reason}</p>
        </div>
      )}

      {/* Detalles */}
      <dl className="space-y-3 px-5 py-5 text-sm sm:px-6 sm:py-6">
        <Row label="Titular" value={order.customer_name} />
        <Row label="Evento" value={order.event.name} />
        <Row label="Fecha" value={formatLongDate(order.event.event_date)} />
        <Row label="Hora" value={formatTime(order.event.event_time)} />
        <Row label="Lugar" value={order.event.venue} />
        <Row label="Personas" value={String(order.quantity)} />
        {order.exchange_rate && order.total_bs && (
          <Row
            label="Total Bs."
            value={formatBs(order.total_bs)}
          />
        )}
        <Row
          label="Total USD"
          value={formatCurrency(order.total_usd)}
          highlight
        />
        {order.payment_reference && (
          <Row label="Referencia" value={order.payment_reference} />
        )}
      </dl>

      {/* Acciones */}
      <div className="border-t border-red-950/40 px-5 py-4 sm:px-6">
        <Link
          href="/mi-orden"
          className="block rounded-xl border border-red-950/60 px-4 py-3 text-center text-sm font-semibold text-white/70 transition hover:bg-red-950/30 hover:text-white"
        >
          Buscar otra orden
        </Link>
      </div>
    </div>
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
          highlight ? 'font-bold text-red-400' : 'font-medium text-white',
        )}
      >
        {value}
      </dd>
    </div>
  );
}