'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProductImageUploader from './ProductImageUploader';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'licores', label: 'Licores' },
  { value: 'cervezas', label: 'Cervezas' },
  { value: 'shots', label: 'Shots' },
  { value: 'refrescos', label: 'Refrescos' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'combos', label: 'Combos' },
] as const;

export interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  category: string;
  base_price_usd: number;
  image_url: string | null;
  is_recommended: boolean;
  is_active: boolean;
  sort_order: number;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<ProductFormData>;
}

export default function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>({
    id: initialData?.id,
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    category: initialData?.category ?? 'licores',
    base_price_usd: initialData?.base_price_usd ?? 0,
    image_url: initialData?.image_url ?? null,
    is_recommended: initialData?.is_recommended ?? false,
    is_active: initialData?.is_active ?? true,
    sort_order: initialData?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (form.base_price_usd <= 0) {
      setError('El precio debe ser mayor a 0.');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      if (mode === 'create') {
        const { error: rpcError } = await supabase.rpc(
          'admin_create_consumption_product',
          {
            p_name: form.name.trim(),
            p_description: form.description.trim() || null,
            p_category: form.category,
            p_base_price_usd: form.base_price_usd,
            p_image_url: form.image_url,
            p_is_recommended: form.is_recommended,
            p_sort_order: form.sort_order,
          },
        );

        if (rpcError) {
          setError(rpcError.message);
          setSaving(false);
          return;
        }
      } else {
        if (!form.id) {
          setError('ID de producto faltante.');
          setSaving(false);
          return;
        }

        const { error: rpcError } = await supabase.rpc(
          'admin_update_consumption_product',
          {
            p_id: form.id,
            p_name: form.name.trim(),
            p_description: form.description.trim() || null,
            p_category: form.category,
            p_base_price_usd: form.base_price_usd,
            p_image_url: form.image_url,
            p_is_recommended: form.is_recommended,
            p_is_active: form.is_active,
            p_sort_order: form.sort_order,
          },
        );

        if (rpcError) {
          setError(rpcError.message);
          setSaving(false);
          return;
        }
      }

      router.push('/admin/productos');
      router.refresh();
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

      {/* Básicos */}
      <Section title="Información del producto">
        <Field label="Nombre" required>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ron Cacique 750ml"
            maxLength={80}
            className={inputClass}
          />
        </Field>

        <Field label="Descripción">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="Ron añejo premium, botella de 750ml"
            className={cn(inputClass, 'min-h-[70px] resize-y')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoría" required>
            <select
              required
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Precio base USD" required>
            <input
              type="number"
              required
              min={0.01}
              step={0.01}
              value={form.base_price_usd}
              onChange={(e) =>
                update('base_price_usd', Number(e.target.value) || 0)
              }
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Orden de aparición"
          hint="Número menor = aparece primero en la lista"
        >
          <input
            type="number"
            min={0}
            step={1}
            value={form.sort_order}
            onChange={(e) => update('sort_order', Number(e.target.value) || 0)}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* Imagen */}
      <Section title="Imagen del producto">
        <ProductImageUploader
          value={form.image_url}
          onChange={(url) => update('image_url', url)}
        />
      </Section>

      {/* Visibilidad */}
      <Section title="Visibilidad">
        <Toggle
          label="Producto activo"
          description="Si está desactivado, no aparecerá en el catálogo."
          checked={form.is_active}
          onChange={(v) => update('is_active', v)}
        />
        <Toggle
          label="Marcar como recomendado"
          description="Aparecerá destacado en el catálogo."
          checked={form.is_recommended}
          onChange={(v) => update('is_recommended', v)}
        />
      </Section>

      {/* Footer */}
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
              ? 'Crear producto'
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