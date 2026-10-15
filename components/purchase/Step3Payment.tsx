'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn, formatBs, formatCurrency } from '@/lib/utils';
import type { PaymentConfig, PaymentMethod } from '@/lib/types';

interface Step3PaymentProps {
  methods: PaymentConfig[];
  totalUsd: number;
  totalBs: number;
  exchangeRate: number;
  accessToken: string;
  cartItems?: { product_id: string; quantity: number }[];
  onNext: (method: PaymentMethod) => void;
  onBack: () => void;
}

const METHOD_META: Record<
  PaymentMethod,
  { label: string; icon: string; description: string }
> = {
  pago_movil: {
    label: 'Pago Móvil',
    icon: '📱',
    description: 'Transferencia directa desde tu teléfono móvil',
  },
  zelle: {
    label: 'Zelle',
    icon: '💳',
    description: 'Transferencia bancaria en dólares',
  },
  binance: {
    label: 'Binance Pay',
    icon: '🪙',
    description: 'Pago con criptomonedas',
  },
};

export default function Step3Payment({
  methods,
  totalUsd,
  totalBs,
  exchangeRate,
  accessToken,
  cartItems,
  onNext,
  onBack,
}: Step3PaymentProps) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedConfig = methods.find((m) => m.method === selected);
  const itemsCount = cartItems?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 5 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 5 MB.');
      return;
    }

    setFile(f);
    setError(null);

    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selected) {
      setError('Selecciona un método de pago.');
      return;
    }

    if (!reference.trim()) {
      setError('Ingresa el número de referencia del pago.');
      return;
    }

    if (!file) {
      setError('Debes subir la captura del comprobante.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.url) {
        setError('No se pudo subir la imagen. Intenta de nuevo.');
        setUploading(false);
        return;
      }

      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('upload_payment_proof', {
        p_access_token: accessToken,
        p_payment_method: selected,
        p_payment_reference: reference,
        p_proof_url: uploadData.url,
      });

      if (rpcError) {
        setError('No se pudo guardar el comprobante. Intenta de nuevo.');
        setUploading(false);
        return;
      }

      onNext(selected);
    } catch (err) {
      console.error(err);
      setError('Error de conexión. Intenta de nuevo.');
      setUploading(false);
    }
  }

  async function handleCancel() {
    const confirmed = confirm(
      '¿Cancelar esta compra? Se liberará la entrada que estabas reservando.',
    );
    if (!confirmed) return;

    setCancelling(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .rpc('cancel_order_by_customer', { p_token: accessToken })
      .single<{ status: string; code?: string }>();

    if (error) {
      alert('No se pudo cancelar. Intenta de nuevo.');
      setCancelling(false);
      return;
    }

    if (data?.status === 'already_processed') {
      alert('Esta orden ya fue verificada y no se puede cancelar.');
      setCancelling(false);
      return;
    }

    const eventUrl = window.location.pathname.replace(/\/comprar.*$/, '');
    window.location.href = eventUrl;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white sm:text-2xl">
          Realiza el pago
        </h2>
        <p className="mt-1 text-xs text-white/50 sm:text-sm">
          Elige un método, transfiere y sube tu comprobante
        </p>
      </div>

      {/* Resumen */}
      <div className="rounded-2xl border border-red-950/60 bg-black/40 p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-red-500">
          Resumen
        </p>
        <div className="space-y-2 text-sm">
          {itemsCount > 0 && (
            <div className="flex justify-between text-white/70">
              <span>Consumo incluido</span>
              <span className="font-bold text-white">
                {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
              </span>
            </div>
          )}
          <div className="flex justify-between text-white/70">
            <span>Total USD</span>
            <span className="font-bold text-white">
              {formatCurrency(totalUsd)}
            </span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Tasa VES</span>
            <span className="font-mono text-white/90">
              Bs. {exchangeRate.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-red-950/60 pt-2">
            <span className="text-xs uppercase tracking-wide text-white/60">
              Total en bolívares
            </span>
            <span className="text-lg font-black text-red-400">
              {formatBs(totalBs)}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Métodos */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
          1. Selecciona cómo pagar <span className="text-red-500">*</span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {methods.map((m) => {
            const meta = METHOD_META[m.method];
            const isSelected = selected === m.method;

            return (
              <button
                key={m.method}
                type="button"
                onClick={() => setSelected(m.method)}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition',
                  isSelected
                    ? 'border-red-500 bg-red-600/20 shadow-lg shadow-red-900/40'
                    : 'border-red-950/60 bg-black/40 hover:border-red-800',
                )}
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-3xl">{meta.icon}</span>
                  {isSelected && (
                    <span className="rounded-full border border-red-400 bg-red-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-base font-black text-white sm:text-lg">
                    {meta.label}
                  </p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {meta.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Datos de pago (solo si hay método seleccionado) */}
      {selectedConfig && (
        <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/30 to-black p-4">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            2. Realiza el pago a:
          </p>

          <div className="space-y-2.5">
            {Object.entries(selectedConfig.config).map(([key, value]) => {
              if (!value) return null;
              const labels: Record<string, string> = {
                phone: 'Teléfono',
                bank: 'Banco',
                cedula: 'Cédula',
                owner: 'Titular',
                email: 'Email',
              };
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-red-950/40 bg-black/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {labels[key] ?? key}
                    </p>
                    <p className="truncate text-sm font-bold text-white">
                      {value}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(value, key)}
                    className="shrink-0 rounded-lg border border-red-950/60 bg-black/40 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/70 transition hover:bg-red-950/30 hover:text-white"
                  >
                    {copied === key ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2.5 text-[11px] leading-relaxed text-amber-200">
            💡 <b>Importante:</b> transfiere{' '}
            <b className="text-white">{formatBs(totalBs)}</b> y guarda el
            comprobante.
          </div>
        </div>
      )}

      {/* 3. Comprobante (solo si hay método seleccionado) */}
      {selectedConfig && (
        <div className="space-y-4 rounded-2xl border border-red-950/60 bg-black/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
            3. Sube tu comprobante
          </p>

          <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/70">
                  Monto a pagar
                </p>
                <p className="mt-1 text-lg font-black text-amber-300">
                  {formatBs(totalBs)}
                </p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Número de referencia <span className="text-red-500">*</span>
            </span>
            <input
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: 123456789"
              maxLength={30}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Captura del comprobante <span className="text-red-500">*</span>
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-red-950/60">
                <div className="relative aspect-[3/4] w-full max-w-xs">
                  <Image
                    src={previewUrl}
                    alt="Comprobante"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black"
                >
                  ✕ Cambiar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-red-950/60 bg-black/40 px-4 py-8 transition hover:border-red-800 hover:bg-red-950/20"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm font-bold text-white/80">
                  Haz clic para subir la captura
                </span>
                <span className="text-[11px] text-white/40">
                  JPG, PNG o WebP · Máximo 5 MB
                </span>
              </button>
            )}
          </label>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="min-h-[48px] rounded-xl border border-red-950/60 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-red-950/30 hover:text-white disabled:opacity-40"
        >
          ← Volver
        </button>
        <button
          type="submit"
          disabled={uploading || !selected}
          className={cn(
            'min-h-[52px] rounded-xl px-6 py-3.5 text-sm font-black uppercase tracking-wider transition',
            uploading || !selected
              ? 'cursor-not-allowed bg-white/5 text-white/30'
              : 'bg-gradient-to-r from-red-700 via-red-600 to-red-500 text-white shadow-lg shadow-red-900/40 hover:from-red-600 hover:to-red-500 active:scale-[0.98]',
          )}
        >
          {uploading ? 'Subiendo…' : 'Verificar pago →'}
        </button>
      </div>

      <div className="border-t border-red-950/40 pt-4 text-center">
        <button
          type="button"
          onClick={handleCancel}
          disabled={uploading || cancelling}
          className="text-[11px] text-white/40 underline-offset-2 transition hover:text-red-400 hover:underline disabled:opacity-50"
        >
          {cancelling ? 'Cancelando…' : 'Cancelar esta compra'}
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