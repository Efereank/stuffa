'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import { cn } from '@/lib/utils';
import type { MapTable, TableVisualState } from '@/lib/types';

interface InteractiveMapProps {
  tables: MapTable[];
  selectedTableId?: string | null;
  onSelectTable: (table: MapTable) => void;
  floorPlanSrc?: string;
  isLoading?: boolean;
  className?: string;
  /** Capacidad mínima del grupo. Mesas más pequeñas se bloquean. */
  minCapacity?: number;
  /** Capacidad máxima permitida. Mesas más grandes se bloquean (opcional). */
  maxCapacity?: number;
}

const STATE_STYLES: Record<TableVisualState, string> = {
  available:
    'border-red-500 bg-red-600/35 text-white ' +
    'hover:bg-red-500/60 hover:scale-[1.08] hover:z-20 ' +
    'shadow-[0_0_14px_rgba(220,38,38,0.55)] cursor-pointer',
  occupied:
    'border-neutral-700 bg-neutral-800/70 text-neutral-500 ' +
    'cursor-not-allowed opacity-60',
  selected:
    'border-yellow-300 bg-yellow-400/80 text-black scale-[1.15] z-30 ' +
    'shadow-[0_0_28px_rgba(251,191,36,0.95)] cursor-pointer',
  blocked:
    'border-white/15 bg-white/5 text-white/25 cursor-not-allowed opacity-50',
};

const LEGEND: { state: TableVisualState; label: string; dot: string }[] = [
  { state: 'available', label: 'Para tu grupo',   dot: 'bg-red-500' },
  { state: 'occupied',  label: 'Reservada',       dot: 'bg-neutral-600' },
  { state: 'blocked',   label: 'Otra capacidad',  dot: 'bg-white/20' },
  { state: 'selected',  label: 'Tu selección',    dot: 'bg-yellow-400' },
];

/** Ratio exacto de la imagen del plano */
const FLOOR_PLAN_RATIO = '1263 / 839';

/** Clases que la librería debe IGNORAR (deja pasar el tap nativo) */
const EXCLUDED_CLASSES = ['rzpp-ignore', 'rzpp-control'];

export default function InteractiveMap({
  tables,
  selectedTableId = null,
  onSelectTable,
  floorPlanSrc = '/map/stuffa-floorplan.png',
  isLoading = false,
  className,
  minCapacity = 1,
  maxCapacity,
}: InteractiveMapProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) =>
      e.key === 'Escape' && setFullscreen(false);
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onEsc);
    };
  }, [fullscreen]);

  return (
    <>
      <div
        className={cn(
          'relative mx-auto w-full overflow-hidden rounded-2xl border border-red-950/60',
          'bg-black shadow-2xl shadow-red-950/30',
          'lg:max-w-[860px] xl:max-w-[960px]',
          fullscreen && 'invisible',
          className,
        )}
      >
        {isMobile && (
          <div className="flex items-center justify-between gap-2 border-b border-red-950/60 bg-black/80 px-3 py-2">
            <span className="text-[11px] text-white/60">
              Pellizca para zoom · Toca una mesa roja para reservar
            </span>
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              style={{ touchAction: 'manipulation' }}
              className="shrink-0 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-900/30 active:bg-red-900/50"
            >
              ⛶ Pantalla
            </button>
          </div>
        )}

        <MapCanvas
          tables={tables}
          selectedTableId={selectedTableId}
          onSelectTable={onSelectTable}
          floorPlanSrc={floorPlanSrc}
          isLoading={isLoading}
          minCapacity={minCapacity}
          maxCapacity={maxCapacity}
        />

        <Legend />
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in">
          <div className="safe-top flex items-center justify-between border-b border-red-950/60 bg-black px-3 py-3">
            <span className="text-xs font-semibold text-white/80">
              Pellizca para zoom · Toca una mesa roja para seleccionar
            </span>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              style={{ touchAction: 'manipulation' }}
              className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-900/30 active:bg-red-900/50"
            >
              ✕ Cerrar
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <MapCanvas
              tables={tables}
              selectedTableId={selectedTableId}
              onSelectTable={(t) => {
                onSelectTable(t);
                setFullscreen(false);
              }}
              floorPlanSrc={floorPlanSrc}
              isLoading={isLoading}
              minCapacity={minCapacity}
              maxCapacity={maxCapacity}
            />
          </div>

          <Legend className="border-t border-red-950/60 bg-black" />
        </div>
      )}
    </>
  );
}

/* ============================================================
 * SUB-COMPONENTES
 * ============================================================ */

interface MapCanvasProps {
  tables: MapTable[];
  selectedTableId: string | null;
  onSelectTable: (table: MapTable) => void;
  floorPlanSrc: string;
  isLoading: boolean;
  minCapacity: number;
  maxCapacity?: number;
}

function MapCanvas({
  tables,
  selectedTableId,
  onSelectTable,
  floorPlanSrc,
  isLoading,
  minCapacity,
  maxCapacity,
}: MapCanvasProps) {
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [scale, setScale] = useState(1);

  const updateScale = () => {
    const s = transformRef.current?.state?.scale;
    if (typeof s === 'number') setScale(s);
  };

  return (
    <div
      className="relative w-full select-none"
      style={{ aspectRatio: FLOOR_PLAN_RATIO }}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={1}
        maxScale={4}
        centerOnInit
        centerZoomedOut
        limitToBounds
        doubleClick={{ mode: 'zoomIn', step: 0.7, excluded: EXCLUDED_CLASSES }}
        wheel={{ step: 0.15, excluded: EXCLUDED_CLASSES }}
        pinch={{ step: 5, excluded: EXCLUDED_CLASSES }}
        panning={{
          velocityDisabled: true,
          excluded: EXCLUDED_CLASSES,
        }}
        onZoom={updateScale}
        onZoomStop={updateScale}
        onPanningStop={updateScale}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%' }}
            >
              <div className="relative h-full w-full">
                <Image
                  src={floorPlanSrc}
                  alt="Plano del local Stuffa Disco & Lounge"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 1100px"
                  className="pointer-events-none select-none object-cover"
                />

                {tables.map((table) => {
                  const isSelected = table.id === selectedTableId;
                  const tooSmall = table.capacity < minCapacity;
                  const tooBig =
                    maxCapacity !== undefined && table.capacity > maxCapacity;
                  const outOfRange = tooSmall || tooBig;

                  const visualState: TableVisualState = isSelected
                    ? 'selected'
                    : outOfRange
                      ? 'blocked'
                      : table.is_available
                        ? 'available'
                        : 'occupied';

                  const interactive =
                    (table.is_available && !outOfRange) || isSelected;

                  return (
                    <button
                      key={table.id}
                      type="button"
                      disabled={!interactive}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTable(table);
                      }}
                      aria-label={`${table.code}, zona ${table.zone_name}, capacidad ${table.capacity} personas, ${
                        !table.is_available
                          ? 'reservada'
                          : tooSmall
                            ? 'muy pequeña para tu grupo'
                            : tooBig
                              ? 'muy grande para tu grupo'
                              : 'disponible'
                      }`}
                      aria-pressed={isSelected}
                      title={
                        tooSmall
                          ? `${table.code} · solo ${table.capacity} pers. (tu grupo es de ${minCapacity})`
                          : tooBig
                            ? `${table.code} · ${table.capacity} pers. (tu grupo es de ${minCapacity})`
                            : `${table.code} · ${table.zone_name} · ${table.capacity} pers.`
                      }
                      style={{
                        left: `${table.pos_x}%`,
                        top: `${table.pos_y}%`,
                        width: `${table.width}%`,
                        aspectRatio: `${table.width} / ${table.height}`,
                        transform: `translate(-50%, -50%) rotate(${table.rotation}deg)`,
                        minWidth: '36px',
                        minHeight: '36px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      className={cn(
                        'rzpp-ignore',
                        'absolute flex items-center justify-center border-2',
                        'text-[10px] font-bold uppercase tracking-tight sm:text-[11px]',
                        'transition-[background-color,border-color,box-shadow,transform] duration-200 outline-none',
                        'focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-black',
                        table.shape === 'circle' ? 'rounded-full' : 'rounded-md',
                        STATE_STYLES[visualState],
                      )}
                    >
                      <span className="pointer-events-none px-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {table.code}
                      </span>
                    </button>
                  );
                })}

                {isLoading && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-xs text-white/80 sm:text-sm">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      Actualizando disponibilidad…
                    </div>
                  </div>
                )}
              </div>
            </TransformComponent>

            {/* Controles de zoom */}
            <div className="rzpp-control absolute bottom-3 left-3 z-50 flex flex-col gap-1.5 sm:bottom-4 sm:left-4">
              <ZoomButton
                onClick={() => {
                  zoomIn(0.5);
                  updateScale();
                }}
                label="Acercar"
              >
                +
              </ZoomButton>

              <ZoomButton
                onClick={() => {
                  zoomOut(0.5);
                  updateScale();
                }}
                label="Alejar"
              >
                −
              </ZoomButton>

              {scale > 1.05 && (
                <ZoomButton
                  onClick={() => {
                    resetTransform();
                    updateScale();
                  }}
                  label="Restablecer"
                >
                  ↺
                </ZoomButton>
              )}

              <div className="pointer-events-none rounded-full bg-black/70 px-2 py-1 text-center text-[10px] font-semibold text-white/70 backdrop-blur">
                {Math.round(scale * 100)}%
              </div>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

function ZoomButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full',
        'border border-red-900/60 bg-black/85 text-lg font-bold text-white',
        'shadow-lg backdrop-blur transition',
        'hover:bg-black/95 active:scale-95 active:bg-red-600/60',
      )}
    >
      {children}
    </button>
  );
}

function Legend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-red-950/60 bg-black/80 px-3 py-3 sm:gap-x-5 sm:px-4',
        className,
      )}
    >
      {LEGEND.map(({ label, dot }) => (
        <span
          key={label}
          className="flex items-center gap-1.5 text-[11px] text-white/70 sm:gap-2 sm:text-xs"
        >
          <span className={cn('h-2.5 w-2.5 rounded-full', dot)} />
          {label}
        </span>
      ))}
      <span className="ml-auto hidden text-xs text-white/40 sm:inline">
        Ajusta el número de personas arriba para filtrar
      </span>
    </div>
  );
}