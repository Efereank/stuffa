'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { AdminReservation, TableOption } from '@/lib/types';

interface EditReservationModalProps {
  reservation: AdminReservation;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditReservationModal({
  reservation,
  onClose,
  onSaved,
}: EditReservationModalProps) {
  const [tables, setTables] = useState<TableOption[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tableId, setTableId] = useState(reservation.tables?.code ? '' : '');
  const [partySize, setPartySize] = useState(reservation.party_size);
  const [time, setTime] = useState(reservation.reservation_time.slice(0, 5));
  const [notes, setNotes] = useState(reservation.notes ?? '');

  // Cargar mesas disponibles para esa fecha
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('get_tables_for_date', { p_date: reservation.reservation_date })
        .returns<
          {
            id: string;
            code: string;
            zone_name: string;
            capacity: number;
            is_available: boolean;
          }[]
        >();

      if (error) {
        setError(error.message);
      } else {
        // Asegurarnos de que `data` sea un array antes de usar métodos de array
        const rows = Array.isArray(data) ? data : [];

        // Encontramos la mesa actual de la reserva
        const currentTable = rows.find((t) => t.code === reservation.tables?.code);
        if (currentTable) setTableId(currentTable.id);

        // Ordenamos: primero la actual, luego las demás
        const sorted = rows.sort((a, b) => {
          if (a.code === reservation.tables?.code) return -1;
          if (b.code === reservation.tables?.code) return 1;
          return a.code.localeCompare(b.code);
        });
        setTables(sorted);
      }
      setLoadingTables(false);
    })();
  }, [reservation]);

  async function handleSave() {
    if (!tableId) {
      setError('Selecciona una mesa.');
      return;
    }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc(
      'admin_update_reservation',
      {
        p_reservation_id: reservation.id,
        p_new_table_id: tableId,
        p_new_date: reservation.reservation_date,
        p_new_time: time,
        p_new_party_size: partySize,
        p_new_notes: notes,
      },
    );

    if (rpcError) {
      const msg = rpcError.message;
      if (msg.includes('TABLE_ALREADY_RESERVED'))
        setError('Esa mesa ya está ocupada ese día.');
      else if (msg.includes('PARTY_TOO_LARGE'))
        setError('El número de personas excede la capacidad de la mesa.');
      else if (msg.includes('NOT_STAFF'))
        setError('No tienes permisos.');
      else setError(msg);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[95dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-neutral-900 shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-400">
              Editar reserva
            </p>
            <p className="mt-0.5 font-bold text-white">
              {reservation.code} · {reservation.customer_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loadingTables ? (
            <p className="text-center text-sm text-white/50">
              Cargando mesas…
            </p>
          ) : (
            <>
              {/* Mesa */}
              <label className="block">
                <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-white/50">
                  Mesa
                </span>
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/70 [color-scheme:dark]"
                >
                  <option value="">— Selecciona una mesa —</option>
                  {tables.map((t) => (
                    <option
                      key={t.id}
                      value={t.id}
                      className="bg-neutral-900"
                      disabled={
                        !t.is_available && t.code !== reservation.tables?.code
                      }
                    >
                      {t.code} · {t.zone_name} · {t.capacity} pers.
                      {!t.is_available && t.code !== reservation.tables?.code
                        ? ' (ocupada)'
                        : ''}
                    </option>
                  ))}
                </select>
              </label>

              {/* Personas + Hora */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-white/50">
                    Personas
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    step={1}
                    inputMode="numeric"
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value) || 1)}
                    className="min-h-[48px] w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/70"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-white/50">
                    Hora
                  </span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="min-h-[48px] w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/70 [color-scheme:dark]"
                  />
                </label>
              </div>

              {/* Notas */}
              <label className="block">
                <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-white/50">
                  Notas
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/70"
                  placeholder="Cumpleaños, botella específica…"
                />
              </label>

              {error && (
                <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-white/10 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loadingTables}
            className="min-h-[48px] rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold uppercase tracking-wider text-black hover:bg-amber-300 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}