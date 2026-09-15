'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface EventCountdownProps {
  /** ISO date/time en formato "YYYY-MM-DDTHH:mm" */
  targetDate: string;
  variant?: 'compact' | 'large';
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  isToday: boolean;
  isSoon: boolean; // menos de 24h
}

function calcTimeLeft(targetDate: string): TimeLeft {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, isToday: false, isSoon: false };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
    isToday: days === 0,
    isSoon: days === 0 && hours < 24,
  };
}

export default function EventCountdown({
  targetDate,
  variant = 'compact',
  className,
}: EventCountdownProps) {
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(targetDate));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(calcTimeLeft(targetDate));

    const interval = setInterval(() => {
      setTime(calcTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Evitar hydration mismatch
  if (!mounted) {
    return (
      <span
        className={cn(
          'text-[10px] font-bold uppercase tracking-widest text-white/40',
          className,
        )}
      >
        Cargando…
      </span>
    );
  }

  if (time.isPast) {
    return (
      <span
        className={cn(
          'text-[10px] font-bold uppercase tracking-widest text-white/40',
          className,
        )}
      >
        Evento pasado
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider',
          time.isToday ? 'text-red-400' : 'text-amber-400',
          className,
        )}
      >
        <span className="text-xs">⏱</span>
        {time.days > 0
          ? `Faltan ${time.days} ${time.days === 1 ? 'día' : 'días'}`
          : `${String(time.hours).padStart(2, '0')}h ${String(time.minutes).padStart(2, '0')}m`}
      </span>
    );
  }

  // Large variant
  return (
    <div className={cn('grid grid-cols-4 gap-2', className)}>
      <TimeBox value={time.days} label="Días" highlight={time.isSoon} />
      <TimeBox value={time.hours} label="Horas" highlight={time.isSoon} />
      <TimeBox value={time.minutes} label="Min" highlight={time.isSoon} />
      <TimeBox value={time.seconds} label="Seg" highlight={time.isSoon} />
    </div>
  );
}

function TimeBox({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 text-center transition',
        highlight
          ? 'animate-pulse border-red-500/60 bg-red-950/40'
          : 'border-red-950/60 bg-black/40',
      )}
    >
      <p
        className={cn(
          'text-2xl font-black sm:text-3xl',
          highlight ? 'text-red-400' : 'text-white',
        )}
      >
        {String(value).padStart(2, '0')}
      </p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/40 sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}