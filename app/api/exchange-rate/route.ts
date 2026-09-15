import { NextResponse } from 'next/server';

/**
 * Obtiene la tasa USD → Bs del BCV.
 * Fuente: pydolarve.org (gratis)
 * Si falla, devuelve una tasa por defecto.
 */
const FALLBACK_RATE = 40;

export const revalidate = 1800; // cache 30 min

export async function GET() {
  try {
    const res = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv', {
      next: { revalidate: 1800 },
    });

    if (!res.ok) throw new Error('Failed to fetch rate');

    const data = await res.json();
    const rate = Number(data?.price);

    if (!rate || isNaN(rate)) throw new Error('Invalid rate');

    return NextResponse.json({
      rate,
      currency: 'VES',
      source: 'BCV',
      updated_at: data?.last_update ?? new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      rate: FALLBACK_RATE,
      currency: 'VES',
      source: 'fallback',
      updated_at: new Date().toISOString(),
    });
  }
}