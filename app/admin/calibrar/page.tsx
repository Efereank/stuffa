'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { MapTable } from '@/lib/types';

/** Ratio exacto del plano — DEBE coincidir con InteractiveMap.tsx */
const FLOOR_PLAN_RATIO = '1263 / 839';

export default function CalibrarPage() {
  const [tables, setTables] = useState<MapTable[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [loading, setLoading] = useState(true);

  // Cargar todas las mesas
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      // Fecha en el futuro para que todas aparezcan "disponibles"
      const { data, error } = await supabase
        .rpc('get_tables_for_date', { p_date: '2099-01-01' })
        .returns<MapTable[]>();

      if (error) {
        setMsg(`❌ Error al cargar mesas: ${error.message}`);
      } else if (data) {
        // La RPC a veces devuelve un objeto de error en lugar de un array.
        // Asegurarnos de que data sea un array antes de setear el estado.
        if (Array.isArray(data)) {
          setTables(data);
        } else {
          setMsg('❌ Error: respuesta inesperada al cargar mesas.');
          console.error('Unexpected RPC response:', data);
        }
      }
      setLoading(false);
    })();
  }, []);

  // Handler del drop
  function handleDrop(e: React.DragEvent<HTMLDivElement>, id: string) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setTables((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              pos_x: +Math.max(0, Math.min(100, x)).toFixed(3),
              pos_y: +Math.max(0, Math.min(100, y)).toFixed(3),
            }
          : t,
      ),
    );
    setDragging(null);
    setSelected(id);
  }

  // Guardar todas las posiciones a Supabase
  async function saveAll() {
    if (!confirm(`¿Guardar las posiciones de ${tables.length} mesas?`)) return;

    setSaving(true);
    setMsg(null);
    const supabase = createClient();

    const results = await Promise.all(
      tables.map((t) =>
        supabase
          .from('tables')
          .update({ pos_x: t.pos_x, pos_y: t.pos_y })
          .eq('id', t.id),
      ),
    );

    const failed = results.filter((r) => r.error);
    setSaving(false);

    if (failed.length) {
      setMsg(`❌ ${failed.length} mesas no se guardaron. Revisa la consola.`);
      console.error(failed.map((f) => f.error));
    } else {
      setMsg(
        `✅ ${tables.length} mesas guardadas. Ve a la home y recarga para verlas.`,
      );
    }
  }

  // Ajuste fino con flechas
  function nudge(id: string, dx: number, dy: number) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              pos_x: +Math.max(0, Math.min(100, t.pos_x + dx)).toFixed(3),
              pos_y: +Math.max(0, Math.min(100, t.pos_y + dy)).toFixed(3),
            }
          : t,
      ),
    );
  }

  // Resetear una mesa a la posición original del último guardado
  async function resetTable(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tables')
      .select('pos_x, pos_y')
      .eq('id', id)
      .single<{ pos_x: number; pos_y: number }>();

    if (error || !data) return;

    setTables((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, pos_x: data.pos_x, pos_y: data.pos_y } : t,
      ),
    );
  }

  const selectedTable = tables.find((t) => t.id === selected);

  // Etiqueta corta para mostrar dentro del cuadrado
  function shortLabel(code: string) {
    return code
      .replace('MESA ', '')
      .replace('BALCÓN ', 'B')
      .replace('TARIMA ', 'T')
      .replace('VIP ', 'V');
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-3 text-white sm:p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400 sm:text-xs">
              Stuffa · Calibrador
            </p>
            <h1 className="mt-1 text-lg font-bold sm:text-xl">
              Ajusta la posición de las mesas
            </h1>
            <p className="mt-1 max-w-xl text-[11px] text-white/50 sm:text-xs">
              Arrastra cada mesa hasta su círculo real en el plano. Usa las
              flechas del panel inferior para ajuste fino. Cuando termines,
              guarda los cambios.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowLabels((v) => !v)}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/5"
            >
              {showLabels ? '🙈 Ocultar' : '👁 Mostrar'}
            </button>
            <button
              type="button"
              onClick={saveAll}
              disabled={saving || loading}
              className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black transition hover:bg-amber-300 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : '💾 Guardar cambios'}
            </button>
          </div>
        </header>

        {/* Mensaje de estado */}
        {msg && (
          <p
            className={cn(
              'mb-3 rounded-lg border px-3 py-2 text-xs',
              msg.startsWith('✅')
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300',
            )}
          >
            {msg}
          </p>
        )}

        {loading && (
          <p className="rounded-lg border border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-white/50">
            Cargando mesas desde Supabase…
          </p>
        )}

        {/* Lienzo del calibrador */}
        {!loading && (
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-neutral-900"
            style={{ aspectRatio: FLOOR_PLAN_RATIO }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Image
              src="/map/stuffa-floorplan.png"
              alt="Plano"
              fill
              priority
              className="pointer-events-none select-none object-cover"
            />

            {tables.map((t) => {
              const isSelected = t.id === selected;
              const isDragging = t.id === dragging;

              return (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragging(t.id)}
                  onDragEnd={() => setDragging(null)}
                  onDrop={(e) => handleDrop(e, t.id)}
                  onClick={() => setSelected(t.id)}
                  title={`${t.code} — x:${t.pos_x} y:${t.pos_y}`}
                  className={cn(
                    'absolute flex cursor-move select-none items-center justify-center',
                    'rounded-md border-2 text-[9px] font-bold text-white',
                    'transition-shadow',
                    isSelected
                      ? 'z-30 border-sky-300 bg-sky-500/70 shadow-[0_0_0_3px_rgba(56,189,248,0.5)]'
                      : isDragging
                        ? 'z-20 border-amber-300 bg-amber-500/70'
                        : 'border-white/60 bg-black/60 hover:border-amber-300',
                  )}
                  style={{
                    left: `${t.pos_x}%`,
                    top: `${t.pos_y}%`,
                    width: '4.5%',
                    height: '6%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {showLabels && (
                    <span className="pointer-events-none whitespace-nowrap px-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                      {shortLabel(t.code)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Panel de ajuste fino */}
        {selectedTable && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-neutral-900 p-3 sm:gap-4 sm:p-4">
            <div className="min-w-[140px]">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 sm:text-xs">
                Seleccionada
              </p>
              <p className="text-base font-bold sm:text-lg">{selectedTable.code}</p>
              <p className="font-mono text-[10px] text-white/50 sm:text-xs">
                x: {selectedTable.pos_x} · y: {selectedTable.pos_y}
              </p>
            </div>

            {/* D-Pad de flechas */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => nudge(selectedTable.id, 0, -0.2)}
                className="h-10 w-10 rounded-lg border border-white/15 text-sm hover:bg-white/5 active:bg-white/10"
                aria-label="Arriba"
              >
                ↑
              </button>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => nudge(selectedTable.id, -0.2, 0)}
                  className="h-10 w-10 rounded-lg border border-white/15 text-sm hover:bg-white/5 active:bg-white/10"
                  aria-label="Izquierda"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => nudge(selectedTable.id, 0.2, 0)}
                  className="h-10 w-10 rounded-lg border border-white/15 text-sm hover:bg-white/5 active:bg-white/10"
                  aria-label="Derecha"
                >
                  →
                </button>
              </div>
              <button
                type="button"
                onClick={() => nudge(selectedTable.id, 0, 0.2)}
                className="h-10 w-10 rounded-lg border border-white/15 text-sm hover:bg-white/5 active:bg-white/10"
                aria-label="Abajo"
              >
                ↓
              </button>
            </div>

            {/* Ajuste rápido */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => resetTable(selectedTable.id)}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/5"
              >
                ↺ Reset
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/5"
              >
                ✕ Deseleccionar
              </button>
            </div>

            <p className="ml-auto text-[11px] text-white/40 sm:text-xs">
              Arrastra con el mouse o usa las flechas. Luego guarda.
            </p>
          </div>
        )}

        {/* Ayuda */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-[11px] text-white/60 sm:p-4 sm:text-xs">
          <p className="mb-1 font-semibold text-white/80">💡 Consejos:</p>
          <ul className="list-inside list-disc space-y-0.5">
            <li>Haz click en una mesa para seleccionarla (se pone azul).</li>
            <li>Arrastra para reposicionar rápido.</li>
            <li>Usa las flechas para mover 0.2% por click.</li>
            <li>
              El cambio se guarda <b>solo al pulsar 💾 Guardar cambios</b>. Si
              recargas sin guardar, se pierde.
            </li>
            <li>
              Cuando termines, borra la carpeta{' '}
              <code className="rounded bg-black/40 px-1 py-0.5 text-amber-300">
                app/admin/calibrar
              </code>{' '}
              para no exponerla en producción.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}