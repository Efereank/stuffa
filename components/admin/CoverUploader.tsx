'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CoverUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export default function CoverUploader({
  value,
  onChange,
  disabled = false,
}: CoverUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 5 MB.');
      return;
    }

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-cover', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError('No se pudo subir la imagen.');
        setUploading(false);
        return;
      }

      onChange(data.url);
    } catch {
      setError('Error de conexión.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-red-950/60 bg-black">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={value}
              alt="Portada"
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/70 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-black/80"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled || uploading}
              className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-950/60"
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className={cn(
            'flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-red-950/60 bg-black/40 transition',
            !disabled && 'hover:border-red-800 hover:bg-red-950/20',
            (disabled || uploading) && 'cursor-wait opacity-60',
          )}
        >
          <span className="text-4xl">{uploading ? '⏳' : '🖼️'}</span>
          <span className="text-sm font-bold text-white/80">
            {uploading ? 'Subiendo…' : 'Subir portada'}
          </span>
          <span className="text-[11px] text-white/40">
            JPG, PNG o WebP · 16:9 · Máx 5 MB
          </span>
        </button>
      )}

      {error && (
        <p className="mt-2 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}