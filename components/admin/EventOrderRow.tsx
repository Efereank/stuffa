'use client';

import { cn, formatTime } from '@/lib/utils';
import type { AdminOrderRow, OrderStatus } from '@/lib/types';

const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: 'Sin pago',
    className: 'border-white/20 bg-white/5 text-white/60',
    dot: 'bg-white/40',
  },
  payment_uploaded: {
    label: 'Por verificar',
    className: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    dot: 'bg-amber-400',
  },
  verified: {
    label: 'Verificada',
    className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  rejected: {
    label: 'Rechazada',
    className: 'border-red-500/40 bg-red-500/15 text-red-300',
    dot: 'bg-red-500',
  },
  checked_in: {
    label: 'Check-in',
    className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200',
    dot: 'bg-emerald-400',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'border-white/20 bg-white/5 text-white/40',
    dot: 'bg-white/30',
  },
};

export default function EventOrderRow({
  order,
  onSelect,
}: {
  order: AdminOrderRow;
  onSelect: () => void;
}) {
  const meta = STATUS_META[order.status];
  const needsAction =
    order.status === 'payment_uploaded' || order.status === 'pending';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-wrap items-center gap-3 rounded-xl border bg-black/40 p-3 text-left transition hover:border-red-800 hover:bg-red-950/20 sm:p-4',
        needsAction ? 'border-amber-500/30' : 'border-red-950/60',
      )}
    >
      {/* Código + hora */}
      <div className="flex shrink-0 flex-col">
        <span className="font-mono text-xs font-bold text-red-400">
          {order.code}
        </span>
        <span className="text-[10px] text-white/40">
          {formatTime(order.created_at.slice(11, 16) + ':00')}
        </span>
      </div>

      {/* Cliente */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">
          {order.customer_name}
        </p>
        <p className="truncate text-[11px] text-white/50">
          {order.customer_phone} · C.I. {order.customer_cedula}
        </p>
      </div>

      {/* Cantidad */}
      <div className="shrink-0 text-center">
        <p className="text-[9px] uppercase tracking-wide text-white/40">
          Entradas
        </p>
        <p className="text-sm font-black text-white">{order.quantity}</p>
      </div>

      {/* Total */}
      <div className="shrink-0 text-right">
        <p className="text-[9px] uppercase tracking-wide text-white/40">
          Total
        </p>
        <p className="text-sm font-black text-white">
          ${order.total_usd.toFixed(2)}
        </p>
      </div>

      {/* Estado */}
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
          meta.className,
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
        {meta.label}
      </span>
    </button>
  );
}