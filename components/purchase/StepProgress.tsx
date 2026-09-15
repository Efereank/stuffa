'use client';

import { cn } from '@/lib/utils';

const STEPS = [
  { number: 1, label: 'Datos' },
  { number: 2, label: 'Pago' },
  { number: 3, label: 'Verificación' },
  { number: 4, label: 'Confirmación' },
];

export default function StepProgress({ current }: { current: number }) {
  return (
    <div className="mx-auto mb-8 max-w-xl">
      <div className="relative flex items-start justify-between">
        {/* Línea de fondo */}
        <div className="absolute left-5 right-5 top-4 h-0.5 bg-red-950/60" />

        {/* Línea de progreso */}
        <div
          className="absolute left-5 top-4 h-0.5 bg-red-500 transition-all duration-500"
          style={{
            width: `calc(${((current - 1) / (STEPS.length - 1)) * 100}% - ${current === 1 ? '0px' : '40px'})`,
            maxWidth: 'calc(100% - 40px)',
          }}
        />

        {STEPS.map((step) => {
          const isDone = step.number < current;
          const isActive = step.number === current;

          return (
            <div
              key={step.number}
              className="relative z-10 flex flex-col items-center"
              style={{ width: '60px' }}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                  isDone &&
                    'border-red-500 bg-red-600 text-white shadow-lg shadow-red-900/50',
                  isActive &&
                    'border-red-400 bg-red-500 text-white shadow-lg shadow-red-900/60 ring-4 ring-red-500/20',
                  !isDone &&
                    !isActive &&
                    'border-red-950/60 bg-black text-white/40',
                )}
              >
                {isDone ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>

              <span
                className={cn(
                  'mt-2 text-[9px] font-bold uppercase tracking-wider sm:text-[10px]',
                  isDone || isActive ? 'text-red-400' : 'text-white/40',
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}