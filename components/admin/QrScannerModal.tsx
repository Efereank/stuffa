'use client';

import { useEffect, useRef, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { cn } from '@/lib/utils';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onToken: (token: string) => Promise<string>;
}

export default function QrScannerModal({
  open,
  onClose,
  onToken,
}: QrScannerModalProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [processing, setProcessing] = useState(false);
  const cooldownRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setFeedback(null);
      setPaused(false);
      setProcessing(false);
      if (cooldownRef.current) window.clearTimeout(cooldownRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleScan(detected: { rawValue: string }[]) {
    const value = detected[0]?.rawValue;
    if (!value || processing || paused) return;

    setProcessing(true);
    setPaused(true);

    const message = await onToken(value);
    setFeedback(message);

    // Si fue escaneo exitoso o ya escaneado → pausa más larga
    // para que el admin pueda leer el mensaje
    const isImportant =
      message.startsWith('✅') || message.startsWith('⚠️');
    const cooldown = isImportant ? 3000 : 2000;

    cooldownRef.current = window.setTimeout(() => {
      setPaused(false);
      setProcessing(false);
      setFeedback(null);
    }, cooldown);
  }

  if (!open) return null;

  const isSuccess = feedback?.startsWith('✅');
  const isWarning = feedback?.startsWith('⚠️');
  const isError = feedback?.startsWith('❌');

  return (
    <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm animate-fade-in sm:items-center sm:justify-center sm:p-4">
      <div className="flex h-full w-full flex-col bg-neutral-950 sm:h-auto sm:max-w-md sm:rounded-3xl sm:border sm:border-red-950/60 sm:shadow-2xl">
        <div className="safe-top flex items-center justify-between border-b border-red-950/60 px-5 py-4">
          <h2 className="text-base font-bold text-white sm:text-lg">
            Escanear QR
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="relative flex-1 bg-black sm:aspect-square sm:flex-none">
          <Scanner
            onScan={handleScan}
            onError={(err) => console.error('[scanner]', err)}
            paused={paused}
            constraints={{ facingMode: 'environment' }}
            styles={{
              container: { width: '100%', height: '100%' },
              video: { objectFit: 'cover' },
            }}
          />

          {/* Overlay cuando está pausado/processing */}
          {paused && !feedback && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            </div>
          )}
        </div>

        <div
          className={cn(
            'safe-bottom px-5 py-4 text-center text-sm font-semibold transition',
            !feedback && 'text-white/50',
            isSuccess && 'bg-emerald-500/10 text-emerald-300',
            isWarning && 'bg-amber-500/10 text-amber-300',
            isError && 'bg-red-500/10 text-red-300',
          )}
          aria-live="polite"
        >
          {feedback ?? 'Apunta la cámara al código QR del cliente'}
        </div>
      </div>
    </div>
  );
}