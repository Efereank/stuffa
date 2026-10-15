'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export default function ProductImageUploader({
  value,
  onChange,
}: ProductImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 5 MB.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-product', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError('No se pudo subir la imagen. Intenta de nuevo.');
        setUploading(false);
        return;
      }

      onChange(data.url);
    } catch (err) {
      console.error(err);
      setError('Error de conexión.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRemove() {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl border border-red-950/60 bg-black/40">
          <Image
            src={value}
            alt="Imagen del producto"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
            unoptimized
          />
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black disabled:opacity-50"
            >
              {uploading ? '…' : 'Cambiar'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="rounded-full bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-red-600 disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'flex w-full max-w-sm flex-col items-center gap-2 rounded-xl border-2 border-dashed border-red-950/60 bg-black/40 px-4 py-8 transition',
            uploading
              ? 'cursor-wait opacity-60'
              : 'hover:border-red-800 hover:bg-red-950/20',
          )}
        >
          <span className="text-3xl">🖼️</span>
          <span className="text-sm font-bold text-white/80">
            {uploading ? 'Subiendo…' : 'Subir imagen del producto'}
          </span>
          <span className="text-[11px] text-white/40">
            JPG, PNG o WebP · Máximo 5 MB
          </span>
        </button>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}