import { cn } from '@/lib/utils';

interface UrgencyBadgeProps {
  sold: number;
  capacity: number;
  /** Multiplicador para exagerar la urgencia (1 = real, 1.3 = 30% más dramático) */
  urgencyMultiplier?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Calcula el estado de urgencia según el % vendido.
 * Los umbrales se ajustan por el multiplicador (opcional).
 */
export function getUrgencyState(
  sold: number,
  capacity: number,
  multiplier: number = 1,
) {
  if (capacity === 0) {
    return { level: 'sold_out' as const, label: 'Agotado', color: 'red' };
  }

  // Aplicar multiplicador al % (simula que se vendió más)
  const realPct = (sold / capacity) * 100;
  const adjustedPct = Math.min(100, realPct * multiplier);

  // Si está agotado de verdad
  if (sold >= capacity) {
    return { level: 'sold_out' as const, label: 'Agotado', color: 'red' };
  }

  if (adjustedPct >= 90) {
    const remaining = Math.max(1, capacity - sold);
    return {
      level: 'critical' as const,
      label: `Últimas ${remaining}`,
      color: 'red',
    };
  }

  if (adjustedPct >= 75) {
    return { level: 'high' as const, label: '¡Últimas entradas!', color: 'orange' };
  }

  if (adjustedPct >= 50) {
    return { level: 'medium' as const, label: 'Vendiendo rápido', color: 'amber' };
  }

  return { level: 'low' as const, label: 'Disponible', color: 'emerald' };
}

export default function UrgencyBadge({
  sold,
  capacity,
  urgencyMultiplier = 1,
  className,
  size = 'md',
}: UrgencyBadgeProps) {
  const state = getUrgencyState(sold, capacity, urgencyMultiplier);

  if (state.level === 'low') return null; // No mostrar nada si hay disponibilidad

  const colors = {
    sold_out: {
      bg: 'bg-neutral-800',
      border: 'border-neutral-600',
      text: 'text-white/60',
      dot: 'bg-white/40',
    },
    critical: {
      bg: 'bg-red-600',
      border: 'border-red-400',
      text: 'text-white',
      dot: 'bg-white animate-pulse',
    },
    high: {
      bg: 'bg-orange-600',
      border: 'border-orange-400',
      text: 'text-white',
      dot: 'bg-white animate-pulse',
    },
    medium: {
      bg: 'bg-amber-600',
      border: 'border-amber-400',
      text: 'text-white',
      dot: 'bg-white',
    },
    low: {
      bg: 'bg-emerald-600',
      border: 'border-emerald-400',
      text: 'text-white',
      dot: 'bg-white',
    },
  }[state.level];

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[10px]',
    lg: 'px-3 py-1.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-black uppercase tracking-widest shadow-lg',
        colors.bg,
        colors.border,
        colors.text,
        sizes[size],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
      {state.label}
    </span>
  );
}