'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import InteractiveMap from '@/components/map/InteractiveMap';
import TableDetailCard from '@/components/map/TableDetailCard';
import BookingForm from '@/components/booking/BookingForm';
import PartySizeModal from '@/components/booking/PartySizeModal';
import type { MapTable } from '@/lib/types';
import {
  cn,
  formatDayName,
  formatLongDate,
  formatShortDate,
  monthKey,
} from '@/lib/utils';

interface BookingFlowProps {
  tables: MapTable[];
  date: string;
  availableDates: string[];
}

export default function BookingFlow({
  tables,
  date,
  availableDates,
}: BookingFlowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTable, setSelectedTable] = useState<MapTable | null>(null);
  const [step, setStep] = useState<'map' | 'form'>('map');

  const [partySize, setPartySize] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (partySize === null) setModalOpen(true);
  }, [partySize]);

  useEffect(() => {
    setSelectedTable(null);
    setStep('map');
  }, [date]);

  function handleDateChange(newDate: string) {
    startTransition(() => router.push(`/?date=${newDate}`, { scroll: false }));
  }

  useEffect(() => {
    if (partySize === null || !selectedTable) return;
    if (selectedTable.capacity < partySize) {
      setSelectedTable(null);
      setStep('map');
    }
  }, [partySize, selectedTable]);

  useEffect(() => {
    if (!selectedTable) return;
    const fresh = tables.find((t) => t.id === selectedTable.id);
    if (!fresh || !fresh.is_available) setSelectedTable(null);
  }, [tables, selectedTable]);

  const datesToShow = useMemo(() => {
    if (availableDates.length === 0) return [];
    const currentMonth = monthKey(date);
    const inCurrentMonth = availableDates.filter(
      (d) => monthKey(d) === currentMonth,
    );
    const rest = availableDates.filter((d) => monthKey(d) !== currentMonth);
    return [...inCurrentMonth, ...rest.slice(0, 2)];
  }, [availableDates, date]);

  const effectivePartySize = partySize ?? 1;

  const { minAllowed, maxAllowed, hasExact } = useMemo(() => {
    const available = tables.filter((t) => t.is_available);

    const exact = available.filter((t) => t.capacity === effectivePartySize);
    if (exact.length > 0) {
      return {
        minAllowed: effectivePartySize,
        maxAllowed: effectivePartySize,
        hasExact: true,
      };
    }

    const near = available.filter(
      (t) =>
        t.capacity > effectivePartySize &&
        t.capacity <= effectivePartySize + 2,
    );
    if (near.length > 0) {
      return {
        minAllowed: effectivePartySize,
        maxAllowed: effectivePartySize + 2,
        hasExact: false,
      };
    }

    const anyLarger = available
      .filter((t) => t.capacity >= effectivePartySize)
      .map((t) => t.capacity);
    const maxCap =
      anyLarger.length > 0 ? Math.max(...anyLarger) : effectivePartySize;

    return {
      minAllowed: effectivePartySize,
      maxAllowed: maxCap,
      hasExact: false,
    };
  }, [tables, effectivePartySize]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mx-auto w-full space-y-3 lg:max-w-[860px] xl:max-w-[960px]">
        <div className="rounded-2xl border border-red-950/60 bg-red-950/10 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="group flex items-center gap-3 rounded-xl border border-red-900/60 bg-black/40 px-3 py-2 text-left transition hover:border-red-700 hover:bg-red-950/30 active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600/30 text-lg">
                👥
              </span>
              <span className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                  Personas
                </span>
                <span className="text-sm font-bold text-white">
                  {partySize === null
                    ? 'Elegir'
                    : `${partySize} ${partySize === 1 ? 'persona' : 'personas'}`}
                  <span className="ml-2 text-[10px] font-semibold text-red-400 opacity-0 transition group-hover:opacity-100">
                    Cambiar
                  </span>
                </span>
              </span>
            </button>

            <p className="text-xs capitalize text-white/60 sm:text-sm">
              {formatLongDate(date)}
            </p>
          </div>

          {partySize !== null && (
            <p className="mt-2 text-[11px] text-white/50 sm:text-xs">
              {hasExact ? (
                <>
                  Mostrando solo mesas de{' '}
                  <span className="font-bold text-red-400">
                    {effectivePartySize} personas
                  </span>
                </>
              ) : maxAllowed > effectivePartySize ? (
                <>
                  No hay mesas de {effectivePartySize} disponibles. Mostrando
                  hasta{' '}
                  <span className="font-bold text-yellow-400">
                    {maxAllowed} personas
                  </span>
                </>
              ) : (
                <>Sin mesas disponibles para tu grupo</>
              )}
            </p>
          )}

          <div className="mt-3 border-t border-red-950/40 pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-red-500 sm:text-xs">
              Fecha de tu visita
            </p>

            {datesToShow.length === 0 ? (
              <p className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-xs text-red-300 sm:text-sm">
                No hay fechas disponibles por el momento. Vuelve pronto.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {datesToShow.map((d) => {
                  const active = d === date;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDateChange(d)}
                      disabled={isPending}
                      className={cn(
                        'flex flex-col items-center gap-0.5 rounded-xl border px-4 py-2.5 text-center transition',
                        'min-w-[92px]',
                        active
                          ? 'border-red-500 bg-red-600/30 text-white shadow-[0_0_16px_rgba(220,38,38,0.5)]'
                          : 'border-red-950/60 bg-black/40 text-white/70 hover:border-red-800 hover:bg-red-950/30',
                        isPending && 'opacity-60',
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-wide',
                          active ? 'text-red-200' : 'text-white/50',
                        )}
                      >
                        {formatDayName(d)}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-bold',
                          active ? 'text-white' : 'text-white/90',
                        )}
                      >
                        {formatShortDate(d)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {step === 'map' ? (
        <>
          <InteractiveMap
            tables={tables}
            selectedTableId={selectedTable?.id ?? null}
            onSelectTable={setSelectedTable}
            isLoading={isPending}
            minCapacity={minAllowed}
            maxCapacity={maxAllowed}
          />

          {selectedTable && (
            <TableDetailCard
              table={selectedTable}
              onClose={() => setSelectedTable(null)}
              onContinue={() => setStep('form')}
            />
          )}
        </>
      ) : (
        selectedTable && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-950/60 bg-black/60 p-4 shadow-2xl shadow-red-950/20 sm:p-6">
            <h2 className="mb-5 text-lg font-black text-white sm:mb-6 sm:text-xl">
              Completa tus datos
            </h2>
            <BookingForm
              table={selectedTable}
              date={date}
              initialPartySize={effectivePartySize}
              onBack={() => setStep('map')}
            />
          </div>
        )
      )}

      <PartySizeModal
        open={modalOpen}
        initialValue={partySize ?? 2}
        required={partySize === null}
        onConfirm={(size) => {
          setPartySize(size);
          setModalOpen(false);
        }}
        onClose={() => {
          if (partySize !== null) setModalOpen(false);
        }}
      />
    </div>
  );
}