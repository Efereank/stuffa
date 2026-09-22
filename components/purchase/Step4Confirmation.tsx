'use client';

import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  formatCurrency,
  formatLongDate,
  formatTime,
} from '@/lib/utils';
import type { OrderDetail } from '@/lib/types';

export default function Step4Confirmation({
  order,
}: {
  order: OrderDetail;
}) {
  // 🎯 Obtener el dominio actual desde el navegador
  const siteUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? '';

  const qrValue = `${siteUrl}/orden/${order.qr_token}`;

  return (
    <div className="space-y-6">
      {/* Mensaje de éxito */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400/40 bg-emerald-500/20 text-3xl">
          ✅
        </div>
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          ¡Pago en verificación!
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
          Tu pago está siendo revisado.
        </p>
      </div>

      {/* Estado de la orden */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 to-black p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⏳</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-300">
              Verificación en proceso
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Nuestro equipo revisará tu comprobante en las próximas horas.
            </p>

            {/* 💡 Instrucción sobre el QR */}
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-black/40 px-3 py-2.5">
              <span className="shrink-0 text-base">📸</span>
              <p className="text-[11px] leading-relaxed text-white/70">
                <b className="text-amber-300">Importante:</b> toma una captura
                de pantalla del{' '}
                <b className="text-white">código QR</b> que aparece abajo.
                Escanéalo cuando quieras para consultar si tu pago ya fue
                verificado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket con QR */}
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-red-950/60 bg-neutral-950 shadow-2xl shadow-red-950/30">
        {/* Header */}
        <div className="relative px-5 py-6 text-white sm:px-6">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-800" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-90 sm:text-[11px]">
                Stuffa Disco &amp; Lounge
              </p>
              <p className="mt-2 text-3xl font-black sm:text-4xl">
                {order.code}
              </p>
              <p className="mt-1 text-xs font-semibold opacity-90">
                Pendiente de verificación
              </p>
            </div>
            <div className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">
              {order.ticket_type.name}
            </div>
          </div>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center gap-4 border-b border-dashed border-red-950/60 bg-red-950/5 px-5 py-7 sm:px-6 sm:py-8">
          <div className="w-full max-w-[230px] rounded-2xl bg-white p-4 opacity-40 shadow-lg shadow-red-950/40">
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
          <p className="max-w-[280px] text-center text-xs leading-relaxed text-white/60">
            Escanea este QR para consultar el estado de tu orden.
            Se activará por completo cuando verifiquemos tu pago.
          </p>
        </div>

        {/* Detalles */}
        <dl className="space-y-3 px-5 py-5 text-sm sm:px-6 sm:py-6">
          <Row label="Titular" value={order.customer_name} />
          <Row label="Evento" value={order.event.name} />
          <Row
            label="Fecha"
            value={formatLongDate(order.event.event_date)}
          />
          <Row label="Hora" value={formatTime(order.event.event_time)} />
          <Row label="Cantidad" value={`${order.quantity} entradas`} />
          <Row
            label="Total"
            value={formatCurrency(order.total_usd)}
            highlight
          />
          <Row
            label="Referencia"
            value={order.payment_reference ?? '—'}
          />
        </dl>
      </div>

      {/* Acciones */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/orden/${order.qr_token}`}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 sm:w-auto"
        >
          Ver mi orden
        </Link>

        <Link
          href="/"
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-red-950/60 px-6 py-3 text-sm font-semibold text-white/70 transition hover:bg-red-950/30 hover:text-white sm:w-auto"
        >
          Volver al inicio
        </Link>
      </div>

      <p className="text-center text-[11px] text-white/40">
        💡 Guarda una captura del <b className="text-red-400">código QR</b> para
        consultar el estado de tu orden en cualquier momento.
      </p>
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
        className={
          'text-right ' +
          (highlight ? 'font-bold text-red-400' : 'font-medium text-white')
        }
      >
        {value}
      </dd>
    </div>
  );
}