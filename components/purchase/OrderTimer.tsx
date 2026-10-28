'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface OrderTimerProps {
  startTime: number;
  onExpire: () => void;
}

export default function OrderTimer({ startTime, onExpire }: OrderTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, 600 - elapsed);
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = 600 - elapsedSeconds;

      if (remaining <= 0) {
        setTimeLeft(0);
        onExpire();
      } else {
        setTimeLeft(remaining);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [startTime, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isExpired = timeLeft === 0;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-xl border px-3 py-2 transition-colors",
      isExpired 
        ? "border-red-500 bg-red-950/50" 
        : timeLeft < 60 
          ? "border-red-500/40 bg-red-950/30 animate-pulse" 
          : "border-amber-500/40 bg-amber-950/20"
    )}>
      <p className={cn(
        "text-[9px] font-bold uppercase tracking-widest",
        isExpired ? "text-red-400" : timeLeft < 60 ? "text-red-400" : "text-amber-400"
      )}>
        {isExpired ? 'Expirado' : 'Tiempo restante'}
      </p>
      <div className={cn(
        "text-xl font-black tabular-nums leading-none mt-1",
        timeLeft < 60 ? "text-red-500" : "text-amber-400"
      )}>
        {isExpired ? '00:00' : formattedTime}
      </div>
    </div>
  );
}