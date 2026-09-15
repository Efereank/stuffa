'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn, formatBs } from '@/lib/utils';
import type { PaymentMethod } from '@/lib/types';

interface Step3ProofProps {
  accessToken: string;
  paymentMethod: PaymentMethod;
  totalBs: number;
  onNext: () => void;
  onBack: () => void;
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  pago_movil: 'Pago Móvil',
  zelle: 'Zelle',
  binance: 'Binance Pay',
};

export default function Step3Proof({
  accessToken,
  paymentMethod,
  totalBs,
  onNext,
  onBack,
}: Step3ProofProps) {
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState(totalBs.toFixed(2));
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 5 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 5 MB.');
      return;
    }

    setFile(f);
    setError(null);

    // Preview
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
      // 1. Subir imagen
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

      // 2. Actualizar orden
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('upload_payment_proof', {
        p_access_token: accessToken,
        p_payment_method: paymentMethod,
        p_payment_reference: reference,
        p_proof_url: uploadData.url,
      });

      if (rpcError) {
        setError('No se pudo guardar el comprobante. Intenta de nuevo.');
        setUploading(false);
        return;
      }

      onNext();
    } catch (err) {
      console.error(err);
      setError('Error de conexión. Intenta de nuevo.');
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white sm:text-2xl">
          Verifica tu pago
        </h2>
        <p className="mt-1 text-xs text-white/50 sm:text-sm">
          Sube el comprobante para confirmar tu transacción
        </p>
      </div>

      {/* Método seleccionado */}
      <div className="rounded-xl border border-red-950/60 bg-black/40 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Método seleccionado
        </p>
        <p className="mt-1 text-base font-black text-red-400">
          {METHOD_LABEL[paymentMethod]}
        </p>
      </div>

      {/* Monto a pagar */}
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

      <Field label="Número de referencia" required>
        <input
          required
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ej: 123456789"
          maxLength={30}
          className={inputClass}
        />
      </Field>

      <Field label="Monto transferido (Bs.)" required>
        <input
          required
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />
        <span className="mt-1 block text-[11px] text-white/40">
          💡 Debe coincidir con {formatBs(totalBs)}
        </span>
      </Field>

      <Field label="Captura del comprobante" required>
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
      </Field>

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
          disabled={uploading}
          className={cn(
            'min-h-[52px] rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 active:scale-[0.98]',
            uploading && 'cursor-wait opacity-60',
          )}
        >
          {uploading ? 'Subiendo…' : 'Verificar pago →'}
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}