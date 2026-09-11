'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface EditableTable {
  id: string;
  code: string;
  zone_id: string;
  zone_name: string;
  capacity: number;
  min_consumption: number;
  min_consumption_label: string | null;
  is_active: boolean;
  _original: {
    code: string;
    capacity: number;
    min_consumption: number;
    min_consumption_label: string | null;
    is_active: boolean;
  };
}

const MAX_CAPACITY = 30;

export default function TablesManager() {
  const [tables, setTables] = useState<EditableTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterZone, setFilterZone] = useState<string>('all');

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tables')
        .select(
          'id, code, zone_id, capacity, min_consumption, min_consumption_label, is_active, zones ( name )',
        )
        .order('code', { ascending: true });

      if (error) {
        setMsg(`❌ ${error.message}`);
      } else {
        const rows: EditableTable[] = (data ?? []).map((t: any) => ({
          id: t.id,
          code: t.code,
          zone_id: t.zone_id,
          zone_name: t.zones?.name ?? '—',
          capacity: t.capacity,
          min_consumption: Number(t.min_consumption),
          min_consumption_label: t.min_consumption_label ?? null,
          is_active: t.is_active,
          _original: {
            code: t.code,
            capacity: t.capacity,
            min_consumption: Number(t.min_consumption),
            min_consumption_label: t.min_consumption_label ?? null,
            is_active: t.is_active,
          },
        }));
        setTables(rows);
      }
      setLoading(false);
    })();
  }, []);

  const zones = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tables) map.set(t.zone_id, t.zone_name);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tables]);

  const filtered = useMemo(() => {
    let rows = tables;
    if (filterZone !== 'all') rows = rows.filter((t) => t.zone_id === filterZone);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.zone_name.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [tables, filterZone, search]);

  function updateField<K extends keyof EditableTable>(
    id: string,
    key: K,
    value: EditableTable[K],
  ) {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: value } : t)),
    );
  }

  function hasChanges(t: EditableTable) {
    return (
      t.code !== t._original.code ||
      t.capacity !== t._original.capacity ||
      t.min_consumption !== t._original.min_consumption ||
      (t.min_consumption_label ?? '') !== (t._original.min_consumption_label ?? '') ||
      t.is_active !== t._original.is_active
    );
  }

  async function saveTable(t: EditableTable) {
    if (t.code.trim().length < 2) {
      setMsg(`❌ El código debe tener al menos 2 caracteres.`);
      return;
    }
    if (t.capacity < 1 || t.capacity > MAX_CAPACITY) {
      setMsg(`❌ ${t.code}: capacidad entre 1 y ${MAX_CAPACITY}.`);
      return;
    }
    if (t.min_consumption < 0) {
      setMsg(`❌ ${t.code}: el consumo no puede ser negativo.`);
      return;
    }

    setSavingId(t.id);
    setMsg(null);
    const supabase = createClient();

    const { error } = await supabase
      .from('tables')
      .update({
        code: t.code.trim(),
        capacity: t.capacity,
        min_consumption: t.min_consumption,
        min_consumption_label:
          t.min_consumption_label?.trim() || null,
        is_active: t.is_active,
      })
      .eq('id', t.id);

    if (error) {
      setMsg(`❌ ${error.message}`);
    } else {
      setMsg(`✅ ${t.code} guardado`);
      setTables((prev) =>
        prev.map((x) =>
          x.id === t.id
            ? {
                ...x,
                code: x.code.trim(),
                min_consumption_label: x.min_consumption_label?.trim() || null,
                _original: {
                  code: x.code.trim(),
                  capacity: x.capacity,
                  min_consumption: x.min_consumption,
                  min_consumption_label: x.min_consumption_label?.trim() || null,
                  is_active: x.is_active,
                },
              }
            : x,
        ),
      );
    }
    setSavingId(null);
  }

  function resetTable(t: EditableTable) {
    setTables((prev) =>
      prev.map((x) =>
        x.id === t.id
          ? {
              ...x,
              code: t._original.code,
              capacity: t._original.capacity,
              min_consumption: t._original.min_consumption,
              min_consumption_label: t._original.min_consumption_label,
              is_active: t._original.is_active,
            }
          : x,
      ),
    );
  }

  async function applyToZone(source: EditableTable) {
    const confirmText = `¿Aplicar consumo mínimo ($${source.min_consumption}) y etiqueta ("${
      source.min_consumption_label ?? '—'
    }") a TODAS las mesas de la zona ${source.zone_name}?`;

    if (!confirm(confirmText)) return;

    setSavingId(source.id);
    setMsg(null);
    const supabase = createClient();

    const { error } = await supabase
      .from('tables')
      .update({
        min_consumption: source.min_consumption,
        min_consumption_label: source.min_consumption_label?.trim() || null,
      })
      .eq('zone_id', source.zone_id);

    if (error) {
      setMsg(`❌ ${error.message}`);
    } else {
      // Actualiza el estado local
      setTables((prev) =>
        prev.map((x) =>
          x.zone_id === source.zone_id
            ? {
                ...x,
                min_consumption: source.min_consumption,
                min_consumption_label:
                  source.min_consumption_label?.trim() || null,
                _original: {
                  ...x._original,
                  min_consumption: source.min_consumption,
                  min_consumption_label:
                    source.min_consumption_label?.trim() || null,
                },
              }
            : x,
        ),
      );
      setMsg(`✅ Aplicado a toda la zona ${source.zone_name}`);
    }
    setSavingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código o zona…"
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/70 sm:max-w-xs"
        />

        <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setFilterZone('all')}
              className={cn(
                'shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition',
                filterZone === 'all'
                  ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                  : 'border-white/10 text-white/60 hover:bg-white/5',
              )}
            >
              Todas
            </button>
            {zones.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setFilterZone(z.id)}
                className={cn(
                  'shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition',
                  filterZone === z.id
                    ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                    : 'border-white/10 text-white/60 hover:bg-white/5',
                )}
              >
                {z.name}
              </button>
            ))}
          </div>
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

      {loading ? (
        <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/50">
          Cargando mesas…
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/50">
          Sin resultados.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const changed = hasChanges(t);
            const saving = savingId === t.id;

            return (
              <article
                key={t.id}
                className={cn(
                  'space-y-3 rounded-2xl border bg-neutral-900/60 p-3 transition sm:p-4',
                  changed
                    ? 'border-amber-400/40 bg-amber-400/[0.03]'
                    : 'border-white/10',
                )}
              >
                {/* Fila 1: Código */}
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/40">
                      Código · {t.zone_name}
                    </span>
                    <input
                      type="text"
                      value={t.code}
                      onChange={(e) => updateField(t.id, 'code', e.target.value)}
                      maxLength={30}
                      className="min-h-[44px] w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-white outline-none focus:border-amber-400/70"
                    />
                  </label>

                  <label className="flex items-end gap-2 pb-1 sm:pb-2">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 sm:hidden">
                      Activa
                    </span>
                    <span className="hidden text-[10px] uppercase tracking-wider text-white/40 sm:inline">
                      Activa
                    </span>
                    <input
                      type="checkbox"
                      checked={t.is_active}
                      onChange={(e) =>
                        updateField(t.id, 'is_active', e.target.checked)
                      }
                      className="h-5 w-5 cursor-pointer accent-emerald-500"
                    />
                  </label>
                </div>

                {/* Fila 2: Capacidad, Consumo, Etiqueta */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/40">
                      Capacidad
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_CAPACITY}
                      step={1}
                      inputMode="numeric"
                      value={t.capacity}
                      onChange={(e) =>
                        updateField(
                          t.id,
                          'capacity',
                          e.target.value === '' ? 0 : Number(e.target.value),
                        )
                      }
                      className="min-h-[44px] w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/70"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/40">
                      Consumo mínimo ($)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={t.min_consumption}
                      onChange={(e) =>
                        updateField(
                          t.id,
                          'min_consumption',
                          e.target.value === '' ? 0 : Number(e.target.value),
                        )
                      }
                      className="min-h-[44px] w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/70"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/40">
                      Etiqueta
                    </span>
                    <input
                      type="text"
                      value={t.min_consumption_label ?? ''}
                      onChange={(e) =>
                        updateField(t.id, 'min_consumption_label', e.target.value)
                      }
                      placeholder="1 botella de whisky"
                      maxLength={60}
                      className="min-h-[44px] w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/70"
                    />
                  </label>
                </div>

                {/* Fila 3: Acciones */}
                <div className="flex flex-wrap items-center gap-2">
                  {changed && (
                    <button
                      type="button"
                      onClick={() => resetTable(t)}
                      disabled={saving}
                      className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/60 hover:bg-white/5 disabled:opacity-40"
                    >
                      ↺ Deshacer
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => applyToZone(t)}
                    disabled={saving}
                    className="rounded-lg border border-sky-400/30 bg-sky-400/5 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-400/10 disabled:opacity-40"
                    title="Aplica el consumo mínimo y la etiqueta a todas las mesas de esta zona"
                  >
                    ⚡ Aplicar a zona {t.zone_name}
                  </button>

                  <button
                    type="button"
                    onClick={() => saveTable(t)}
                    disabled={!changed || saving}
                    className={cn(
                      'ml-auto min-h-[40px] rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition',
                      changed
                        ? 'bg-amber-400 text-black hover:bg-amber-300'
                        : 'cursor-not-allowed border border-white/10 text-white/30',
                    )}
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[11px] text-white/60 sm:p-4 sm:text-xs">
        <p className="mb-1 font-semibold text-white/80"> Notas:</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>
            <b>Código:</b> nombre visible de la mesa (ej. BALCÓN 48, VIP 01).
          </li>
          <li>
            <b>Etiqueta:</b> si la dejas vacía, se usa la etiqueta de la zona.
          </li>
          <li>
            <b>⚡ Aplicar a zona:</b> copia el consumo mínimo y la etiqueta a
            todas las mesas de esa zona.
          </li>
          <li>
            <b>Activa:</b> si la desmarcas, la mesa desaparece del plano.
          </li>
        </ul>
      </div>
    </div>
  );
}