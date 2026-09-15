'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn, formatBs, formatCurrency, formatLongDate } from '@/lib/utils';
import type { AdminOrderRow } from '@/lib/types';

interface OrderVerificationModalProps {
  order: AdminOrderRow;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Sin pago subido',
  payment_uploaded: 'Por verificar',
  verified: 'Verificada',
  rejected: 'Rechazada',
  checked_in: 'Check-in realizado',
  cancelled: 'Cancelada',
};

export default function OrderVerificationModal({
  order,
  onClose,
  onSaved,
}: OrderVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const canVerify =
    order.status === 'payment_uploaded' || order.status === 'pending';
  const canReject =
    order.status !== 'checked_in' && order.status !== 'cancelled';

  async function handleVerify() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('admin_verify_order', {
      p_order_id: order.id,
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    onSaved();
  }

  async function handleReject() {
    if (rejectReason.trim().length < 3) {
      setError('Escribe un motivo (mínimo 3 caracteres).');
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('admin_reject_order', {
      p_order_id: order.id,
      p_reason: rejectReason.trim(),
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm animate-fade-in sm:items-center sm:justify-center sm:p-4">
      <div className="flex h-full w-full flex-col bg-neutral-950 sm:max-h-[95vh] sm:max-w-3xl sm:rounded-3xl sm:border sm:border-red-950/60 sm:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-950/60 px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold text-red-400">
              {order.code}
            </p>
            <h2 className="mt-0.5 truncate text-base font-bold text-white sm:text-lg">
              {order.customer_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Estado */}
          <div className="mb-4 rounded-xl border border-red-950/60 bg-black/40 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              Estado actual
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              {STATUS_LABEL[order.status] ?? order.status}
            </p>
            {order.rejection_reason && (
              <p className="mt-2 text-xs text-red-300">
                Motivo del rechazo: {order.rejection_reason}
              </p>
            )}
          </div>

          {/* Grid de datos */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Datos del cliente */}
            <div className="space-y-3 rounded-xl border border-red-950/60 bg-black/40 p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                Cliente
              </h3>
              <InfoRow label="Nombre" value={order.customer_name} />
              <InfoRow label="Cédula" value={order.customer_cedula} />
              <InfoRow label="Teléfono" value={order.customer_phone} />
              {order.customer_email && (
                <InfoRow label="Email" value={order.customer_email} />
              )}
            </div>

            {/* Datos de la orden */}
            <div className="space-y-3 rounded-xl border border-red-950/60 bg-black/40 p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                Orden
              </h3>
              <InfoRow
                label="Entradas"
                value={`${order.quantity} (${order.men_count}H · ${order.women_count}M)`}
              />
              <InfoRow
                label="Total USD"
                value={formatCurrency(order.total_usd)}
                highlight
              />
              {order.total_bs && (
                <InfoRow label="Total Bs." value={formatBs(order.total_bs)} />
              )}
              <InfoRow
                label="Creada"
                value={new Date(order.created_at).toLocaleString('es-VE', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            </div>

            {/* Datos de pago */}
            <div className="space-y-3 rounded-xl border border-red-950/60 bg-black/40 p-4 sm:col-span-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                Pago
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoRow
                  label="Método"
                  value={order.payment_method ?? '—'}
                />
                <InfoRow
                  label="Referencia"
                  value={order.payment_reference ?? '—'}
                />
                <InfoRow
                  label="Subido"
                  value={
                    order.payment_uploaded_at
                      ? new Date(order.payment_uploaded_at).toLocaleString(
                          'es-VE',
                          {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )
                      : '—'
                  }
                />
              </div>
            </div>
          </div>

          {/* Comprobante */}
          {order.payment_proof_url ? (
            <div className="mt-4">
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red-500">
                Comprobante
              </h3>
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-xl border border-red-950/60 bg-black"
              >
                <div className="relative aspect-[3/4] max-h-[60vh] w-full">
                  <Image
                    src={order.payment_proof_url}
                    alt="Comprobante de pago"
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="absolute bottom-2 right-2 rounded-lg bg-black/80 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/80 backdrop-blur">
                  Abrir original ↗
                </span>
              </a>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-red-950/60 bg-black/40 px-4 py-6 text-center">
              <p className="text-xs text-white/40">
                Sin comprobante subido
              </p>
            </div>
          )}

          {/* Rechazo */}
          {rejectMode && (
            <div className="mt-4 space-y-2">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-red-500">
                  Motivo del rechazo
                </span>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="Ej: La referencia no coincide / el monto es incorrecto…"
                  className="w-full rounded-xl border border-red-950/60 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-red-500/70"
                />
              </label>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-red-950/60 p-4">
          {rejectMode ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setRejectMode(false);
                  setRejectReason('');
                  setError(null);
                }}
                disabled={loading}
                className="min-h-[44px] rounded-xl border border-red-950/60 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading}
                className="min-h-[44px] rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {loading ? 'Rechazando…' : 'Confirmar rechazo'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-xl border border-red-950/60 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5"
              >
                Cerrar
              </button>

              {canVerify || canReject ? (
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  {canReject && (
                    <button
                      type="button"
                      onClick={() => setRejectMode(true)}
                      disabled={loading}
                      className="min-h-[44px] rounded-xl border border-red-500/40 bg-red-950/20 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-950/40 disabled:opacity-60"
                    >
                      Rechazar
                    </button>
                  )}
                  {canVerify && (
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={loading}
                      className="min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-900/40 transition hover:from-emerald-600 hover:to-emerald-500 disabled:opacity-60"
                    >
                      {loading ? 'Verificando…' : '✓ Verificar pago'}
                    </button>
                  )}
                </div>
              ) : (
                <span className="self-center text-xs text-white/40">
                  Esta orden ya fue procesada
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-white/40">{label}</span>
      <span
        className={cn(
          'text-right',
          highlight ? 'font-bold text-red-400' : 'font-medium text-white',
        )}
      >
        {value}
      </span>
    </div>
  );
}