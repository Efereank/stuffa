'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CoverUploader from './CoverUploader';
import { cn } from '@/lib/utils';

export interface EventFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  cover_url: string | null;
  event_date: string;
  event_time: string;
  doors_open_at: string;
  venue: string;
  city: string;
  is_active: boolean;
  is_featured: boolean;
  is_sold_out: boolean;
  // Ticket type (por simplicidad: 1 por evento)
  ticket_name: string;
  ticket_description: string;
  ticket_price_usd: number;
  ticket_capacity: number;
  ticket_benefits: string[];
  ticket_id?: string;
  ticket_sold?: number;
}

interface EventFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<EventFormData>;
}

/** Convierte un nombre a slug */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function EventForm({ mode, initialData }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormData>({
    id: initialData?.id,
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    description: initialData?.description ?? '',
    cover_url: initialData?.cover_url ?? null,
    event_date: initialData?.event_date ?? '',
    event_time: initialData?.event_time ?? '22:00',
    doors_open_at: initialData?.doors_open_at ?? '',
    venue: initialData?.venue ?? 'Stuffa Disco & Lounge',
    city: initialData?.city ?? 'Maracaibo',
    is_active: initialData?.is_active ?? true,
    is_featured: initialData?.is_featured ?? false,
    is_sold_out: initialData?.is_sold_out ?? false,
    ticket_name: initialData?.ticket_name ?? 'GENERAL',
    ticket_description:
      initialData?.ticket_description ?? 'Acceso general al evento',
    ticket_price_usd: initialData?.ticket_price_usd ?? 3,
    ticket_capacity: initialData?.ticket_capacity ?? 100,
    ticket_benefits: initialData?.ticket_benefits ?? [
      'Bar disponible',
      'Zona principal',
      'Experiencia completa Stuffa',
    ],
    ticket_id: initialData?.ticket_id,
    ticket_sold: initialData?.ticket_sold ?? 0,
  });
  const [benefitInput, setBenefitInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof EventFormData>(
    key: K,
    value: EventFormData[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-slug cuando escriben el nombre y el slug está vacío o coincide con el anterior
      if (key === 'name' && mode === 'create') {
        if (!prev.slug || prev.slug === slugify(prev.name)) {
          next.slug = slugify(String(value)) + '-' + (prev.event_date || '');
        }
      }
      // Auto-slug también cuando cambian la fecha
      if (key === 'event_date' && mode === 'create' && prev.name) {
        if (!prev.slug || prev.slug === slugify(prev.name) + '-' + prev.event_date) {
          next.slug = slugify(prev.name) + '-' + String(value);
        }
      }
      return next;
    });
  }

  function addBenefit() {
    const b = benefitInput.trim();
    if (!b) return;
    setForm((prev) => ({
      ...prev,
      ticket_benefits: [...prev.ticket_benefits, b],
    }));
    setBenefitInput('');
  }

  function removeBenefit(idx: number) {
    setForm((prev) => ({
      ...prev,
      ticket_benefits: prev.ticket_benefits.filter((_, i) => i !== idx),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (form.name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    if (!form.slug || form.slug.length < 3) {
      setError('El slug es inválido.');
      return;
    }
    if (!form.event_date) {
      setError('Selecciona una fecha.');
      return;
    }
    if (!form.event_time) {
      setError('Selecciona una hora.');
      return;
    }
    if (form.ticket_capacity < (form.ticket_sold ?? 0)) {
      setError(
        `La capacidad no puede ser menor a las entradas ya vendidas (${form.ticket_sold}).`,
      );
      return;
    }
    if (form.ticket_price_usd < 0) {
      setError('El precio no puede ser negativo.');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      if (mode === 'create') {
        // 1. Crear evento
        const { data: event, error: eventError } = await supabase
          .from('events')
          .insert({
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim() || null,
            cover_url: form.cover_url,
            event_date: form.event_date,
            event_time: form.event_time,
            doors_open_at: form.doors_open_at || null,
            venue: form.venue,
            city: form.city,
            is_active: form.is_active,
            is_featured: form.is_featured,
            is_sold_out: form.is_sold_out,
          })
          .select('id')
          .single();

        if (eventError || !event) {
          if (eventError?.code === '23505') {
            setError('Ya existe un evento con ese slug.');
          } else {
            setError(eventError?.message ?? 'Error al crear el evento.');
          }
          setSaving(false);
          return;
        }

        // 2. Crear ticket type
        const { error: ticketError } = await supabase
          .from('ticket_types')
          .insert({
            event_id: event.id,
            name: form.ticket_name,
            description: form.ticket_description,
            price_usd: form.ticket_price_usd,
            benefits: form.ticket_benefits,
            capacity: form.ticket_capacity,
            sort_order: 1,
            is_active: true,
          });

        if (ticketError) {
          setError(ticketError.message);
          setSaving(false);
          return;
        }

        router.push(`/admin/eventos/${event.id}`);
        router.refresh();
      } else {
        // EDIT
        if (!form.id) {
          setError('ID de evento faltante.');
          setSaving(false);
          return;
        }

        // 1. Actualizar evento
        const { error: eventError } = await supabase
          .from('events')
          .update({
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim() || null,
            cover_url: form.cover_url,
            event_date: form.event_date,
            event_time: form.event_time,
            doors_open_at: form.doors_open_at || null,
            venue: form.venue,
            city: form.city,
            is_active: form.is_active,
            is_featured: form.is_featured,
            is_sold_out: form.is_sold_out,
          })
          .eq('id', form.id);

        if (eventError) {
          if (eventError.code === '23505') {
            setError('Ya existe otro evento con ese slug.');
          } else {
            setError(eventError.message);
          }
          setSaving(false);
          return;
        }

        // 2. Actualizar o crear ticket type
        if (form.ticket_id) {
          const { error: ticketError } = await supabase
            .from('ticket_types')
            .update({
              name: form.ticket_name,
              description: form.ticket_description,
              price_usd: form.ticket_price_usd,
              benefits: form.ticket_benefits,
              capacity: form.ticket_capacity,
            })
            .eq('id', form.ticket_id);

          if (ticketError) {
            setError(ticketError.message);
            setSaving(false);
            return;
          }
        } else {
          const { error: ticketError } = await supabase
            .from('ticket_types')
            .insert({
              event_id: form.id,
              name: form.ticket_name,
              description: form.ticket_description,
              price_usd: form.ticket_price_usd,
              benefits: form.ticket_benefits,
              capacity: form.ticket_capacity,
              sort_order: 1,
              is_active: true,
            });

          if (ticketError) {
            setError(ticketError.message);
            setSaving(false);
            return;
          }
        }

        router.push(`/admin/eventos/${form.id}`);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('Error inesperado.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Sección: Básicos */}
      <Section title="Información básica">
        <Field label="Nombre del evento" required>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="I Love Reggaeton"
            maxLength={100}
            className={inputClass}
          />
        </Field>

        <Field label="Slug (URL)" required hint="Solo letras, números y guiones">
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => update('slug', slugify(e.target.value))}
            placeholder="i-love-reggaeton-19-sep-2026"
            className={inputClass}
          />
        </Field>

        <Field label="Descripción">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Una noche única con los mejores DJs de Maracaibo…"
            className={cn(inputClass, 'min-h-[80px] resize-y')}
          />
        </Field>
      </Section>

      {/* Sección: Portada */}
      <Section title="Portada">
        <CoverUploader
          value={form.cover_url}
          onChange={(url) => update('cover_url', url)}
        />
      </Section>

      {/* Sección: Fecha y lugar */}
      <Section title="Fecha y lugar">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha" required>
            <input
              type="date"
              required
              value={form.event_date}
              onChange={(e) => update('event_date', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Hora del evento" required>
            <input
              type="time"
              required
              value={form.event_time}
              onChange={(e) => update('event_time', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Apertura de puertas">
            <input
              type="time"
              value={form.doors_open_at}
              onChange={(e) => update('doors_open_at', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Venue" required>
            <input
              type="text"
              required
              value={form.venue}
              onChange={(e) => update('venue', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Ciudad" required>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* Sección: Entrada */}
      <Section title="Entrada (tipo único)">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nombre" required>
            <input
              type="text"
              required
              value={form.ticket_name}
              onChange={(e) => update('ticket_name', e.target.value)}
              placeholder="GENERAL"
              maxLength={30}
              className={inputClass}
            />
          </Field>

          <Field label="Precio USD" required>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={form.ticket_price_usd}
              onChange={(e) =>
                update('ticket_price_usd', Number(e.target.value) || 0)
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="Capacidad"
            required
            hint={
              (form.ticket_sold ?? 0) > 0
                ? `Ya vendidas: ${form.ticket_sold}`
                : undefined
            }
          >
            <input
              type="number"
              required
              min={form.ticket_sold ?? 1}
              step={1}
              value={form.ticket_capacity}
              onChange={(e) =>
                update('ticket_capacity', Number(e.target.value) || 0)
              }
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Descripción del ticket">
          <input
            type="text"
            value={form.ticket_description}
            onChange={(e) => update('ticket_description', e.target.value)}
            placeholder="Acceso general al evento"
            maxLength={100}
            className={inputClass}
          />
        </Field>

        {/* Benefits */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
            Beneficios incluidos
          </span>
          <div className="space-y-2">
            {form.ticket_benefits.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-red-950/60 bg-black/40 px-3 py-2"
              >
                <span className="text-sm text-emerald-400">✓</span>
                <span className="flex-1 text-sm text-white">{b}</span>
                <button
                  type="button"
                  onClick={() => removeBenefit(i)}
                  className="shrink-0 rounded-lg p-1 text-xs text-white/40 transition hover:bg-red-950/30 hover:text-red-400"
                  aria-label={`Eliminar beneficio: ${b}`}
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                placeholder="Ej: Mesa VIP, Botella premium…"
                maxLength={80}
                className={cn(inputClass, 'flex-1')}
              />
              <button
                type="button"
                onClick={addBenefit}
                disabled={!benefitInput.trim()}
                className="shrink-0 rounded-xl border border-red-900/60 bg-red-950/30 px-4 text-sm font-bold text-red-300 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Añadir
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Sección: Visibilidad */}
      <Section title="Visibilidad">
        <Toggle
          label="Evento activo"
          description="Si está desactivado, no aparecerá en la web pública."
          checked={form.is_active}
          onChange={(v) => update('is_active', v)}
        />
        <Toggle
          label="Destacar en la landing"
          description="Aparecerá en la cartelera principal como primer evento."
          checked={form.is_featured}
          onChange={(v) => update('is_featured', v)}
        />
        <Toggle
          label="Marcar como AGOTADO"
          description="Aunque queden cupos, no permitirá comprar más entradas."
          checked={form.is_sold_out}
          onChange={(v) => update('is_sold_out', v)}
        />
      </Section>

      {/* Footer acciones */}
      <div className="flex flex-col-reverse gap-3 border-t border-red-950/60 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="min-h-[48px] rounded-xl border border-red-950/60 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-red-950/30 hover:text-white disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className={cn(
            'min-h-[52px] rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 active:scale-[0.98]',
            saving && 'cursor-wait opacity-60',
          )}
        >
          {saving
            ? 'Guardando…'
            : mode === 'create'
              ? 'Crear evento'
              : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full min-h-[48px] rounded-xl border border-red-950/60 bg-black/40 px-4 py-3 text-sm text-white ' +
  'placeholder:text-white/30 outline-none transition ' +
  'focus:border-red-500/70 focus:bg-black/60 focus:ring-2 focus:ring-red-500/30 ' +
  '[color-scheme:dark]';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-red-950/60 bg-black/40 p-5">
      <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-red-500">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-white/40">{hint}</span>
      )}
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-red-950/60 bg-black/40 p-3.5 transition hover:border-red-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-red-500"
      />
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-white/50">{description}</p>
        )}
      </div>
    </label>
  );
}