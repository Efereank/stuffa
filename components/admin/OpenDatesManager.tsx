'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  cn,
  monthKey,
  shiftMonth,
  toISODate,
  daysInMonth,
  firstWeekdayOfMonth,
  formatMonthYear,
} from '@/lib/utils';
import type { AdminOpenDate } from '@/lib/types';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function OpenDatesManager() {
  const supabaseRef = useMemo(() => createClient(), []);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
  const [dates, setDates] = useState<AdminOpenDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminOpenDate | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  // Cargar días del mes seleccionado
  const refresh = useCallback(async () => {
    setLoading(true);
    const from = `${month}-01`;
    const [y, m] = month.split('-').map(Number);
    const to = toISODate(y, m, daysInMonth(y, m));

    const { data, error } = await supabaseRef.rpc('admin_list_open_dates', {
      p_from: from,
      p_to: to,
    });

    if (error) {
      setMsg(`❌ ${error.message}`);
    } else {
      const rows: AdminOpenDate[] = Array.isArray(data) ? data : [];
      setDates(rows);
      setMsg(null);
    }
    setLoading(false);
  }, [month, supabaseRef]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Toggle abierto/cerrado
  async function toggleDate(d: AdminOpenDate) {
    setSavingDate(d.date);
    const newState = !d.is_open;

    const { error } = await supabaseRef.rpc('admin_set_open_date', {
      p_date: d.date,
      p_is_open: newState,
      p_label: d.label,
    });

    if (error) {
      setMsg(`❌ ${error.message}`);
    } else {
      setMsg(newState ? `✅ ${d.date} habilitado` : `✅ ${d.date} cerrado`);
      await refresh();
    }
    setSavingDate(null);
  }

  // Reset al comportamiento por defecto (viernes/sábado)
  async function resetDate(d: AdminOpenDate) {
    if (
      !confirm(
        `¿Resetear ${d.date}? Volverá a la regla por defecto (viernes/sábado).`,
      )
    )
      return;
    setSavingDate(d.date);
    const { error } = await supabaseRef.rpc('admin_reset_open_date', {
      p_date: d.date,
    });
    if (error) {
      setMsg(`❌ ${error.message}`);
    } else {
      setMsg(`✅ ${d.date} resetado`);
      await refresh();
    }
    setSavingDate(null);
  }

  // Guardar etiqueta
  async function saveLabel() {
    if (!editing) return;
    setSavingDate(editing.date);
    const { error } = await supabaseRef.rpc('admin_set_open_date', {
      p_date: editing.date,
      p_is_open: editing.is_open,
      p_label: labelInput,
    });
    if (error) {
      setMsg(`❌ ${error.message}`);
    } else {
      setMsg(`✅ Etiqueta guardada para ${editing.date}`);
      setEditing(null);
      setLabelInput('');
      await refresh();
    }
    setSavingDate(null);
  }

  // Celdas del calendario
  const cells = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const firstDay = firstWeekdayOfMonth(y, m);
    const total = daysInMonth(y, m);
    const list: (AdminOpenDate | null)[] = [];
    for (let i = 0; i < firstDay; i++) list.push(null);
    for (const d of dates) list.push(d);
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [month, dates]);

  return (
    <div className="space-y-4">
      {/* Header + navegación de mes */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="rounded-lg border border-red-950/60 bg-black/40 px-3 py-2 text-sm text-white/80 transition hover:bg-red-950/30"
            aria-label="Mes anterior"
          >
            ←
          </button>
          <p className="min-w-[160px] text-center text-sm font-bold capitalize text-white sm:text-base">
            {formatMonthYear(month)}
          </p>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="rounded-lg border border-red-950/60 bg-black/40 px-3 py-2 text-sm text-white/80 transition hover:bg-red-950/30"
            aria-label="Mes siguiente"
          >
            →
          </button>
        </div>

        <div className="flex flex-wrap gap-3 text-[11px] text-white/60 sm:text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-500/70" /> Abierto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-white/10" /> Cerrado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-dashed border-amber-400" />{' '}
            Override manual
          </span>
        </div>
      </div>

      {msg && (
        <p
          className={cn(
            'rounded-lg border px-3 py-2 text-xs',
            msg.startsWith('✅')
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300',
          )}
        >
          {msg}
        </p>
      )}

      {/* Calendario */}
      {loading ? (
        <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/50">
          Cargando días…
        </p>
      ) : (
        <div className="rounded-2xl border border-red-950/60 bg-black/40 p-2 sm:p-3">
          {/* Cabecera días de la semana */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/40 sm:text-xs"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Días */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell) return <div key={idx} className="aspect-square" />;

              const day = Number(cell.date.slice(-2));
              const isSaving = savingDate === cell.date;

              return (
                <div
                  key={cell.date}
                  role="button"
                  tabIndex={isSaving ? -1 : 0}
                  aria-disabled={isSaving}
                  aria-label={`${cell.date}. ${
                    cell.is_open ? 'Abierto' : 'Cerrado'
                  }${cell.label ? `. Evento: ${cell.label}` : ''}`}
                  onClick={() => {
                    if (!isSaving) void toggleDate(cell);
                  }}
                  onDoubleClick={() => {
                    setEditing(cell);
                    setLabelInput(cell.label ?? '');
                  }}
                  onKeyDown={(e) => {
                    if (isSaving) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void toggleDate(cell);
                    }
                  }}
                  className={cn(
                    'group relative flex aspect-square cursor-pointer flex-col items-center justify-start gap-0.5 rounded-lg p-1 pt-1.5 text-left outline-none transition',
                    'focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-black',
                    cell.is_open
                      ? 'bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
                      : 'bg-white/5 text-white/60 hover:bg-white/10',
                    !cell.is_default && 'border border-dashed border-amber-400/60',
                    isSaving && 'pointer-events-none opacity-50',
                  )}
                  title={
                    cell.is_default
                      ? 'Por defecto (viernes/sábado)'
                      : 'Configurado manualmente'
                  }
                >
                  <span
                    className={cn(
                      'text-sm font-bold sm:text-base',
                      cell.is_open ? 'text-emerald-100' : 'text-white/70',
                    )}
                  >
                    {day}
                  </span>
                  {cell.label && (
                    <span className="line-clamp-2 w-full truncate text-[9px] text-amber-300 sm:text-[10px]">
                      {cell.label}
                    </span>
                  )}
                  {!cell.is_default && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void resetDate(cell);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white/80 transition hover:bg-black/95 group-hover:flex"
                      title="Resetear a por defecto"
                      aria-label={`Resetear ${cell.date} a por defecto`}
                    >
                      ↺
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ayuda */}
      <div className="rounded-2xl border border-red-950/60 bg-red-950/5 p-3 text-[11px] text-white/60 sm:p-4 sm:text-xs">
        <p className="mb-1 font-semibold text-white/80">💡 Cómo funciona:</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>
            <b>Un click</b> activa/desactiva el día.
          </li>
          <li>
            <b>Doble click</b> (o doble toque) añade una etiqueta al evento
            (ej. &quot;DJ Snake&quot;, &quot;Noche de ladies&quot;).
          </li>
          <li>
            Los días con{' '}
            <span className="text-amber-300">borde punteado amarillo</span>{' '}
            tienen un ajuste manual.
          </li>
          <li>
            El botón <b>↺</b> borra el ajuste y vuelve a la regla por defecto
            (viernes/sábado).
          </li>
        </ul>
      </div>

      {/* Modal de etiqueta */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-red-950/60 bg-neutral-950 p-5 shadow-2xl">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-red-500">
                Etiqueta del evento
              </p>
              <p className="mt-1 text-lg font-bold text-white">{editing.date}</p>
            </div>
            <input
              autoFocus
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Ej. DJ Snake, Noche de ladies…"
              maxLength={80}
              className="w-full rounded-xl border border-red-950/60 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-red-500/70"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setLabelInput('');
                }}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveLabel()}
                disabled={savingDate === editing.date}
                className="rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:from-red-600 hover:to-red-500 disabled:opacity-60"
              >
                {savingDate === editing.date ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}