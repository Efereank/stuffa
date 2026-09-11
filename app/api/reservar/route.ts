import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** Tiempo mínimo (ms) que un humano tarda en rellenar el formulario */
const MIN_FORM_TIME_MS = 2500;

interface Body {
  tableId: string;
  date: string;
  name: string;
  phone: string;
  partySize: number;
  time: string;
  notes: string;
  privacyAccepted: boolean;
  /** Honeypot — debe venir vacío */
  website?: string;
  /** Timestamp cuando el form se abrió (Date.now() en el cliente) */
  startedAt?: number;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_BODY' },
      { status: 400 },
    );
  }

  // ============================================================
  // 🛡️ CAPA 1 — Honeypot
  // ============================================================
  if (body.website && body.website.trim().length > 0) {
    // No le decimos al bot que lo detectamos — devolvemos "éxito" falso.
    // Un bot que vea un error intentará de nuevo; un bot que vea éxito se irá.
    return NextResponse.json({
      success: true,
      // Token falso que no lleva a ningún lado
      qr_token: '00000000-0000-0000-0000-000000000000',
    });
  }

  // ============================================================
  // 🛡️ CAPA 2 — Time-trap
  // ============================================================
  const now = Date.now();
  const elapsed = typeof body.startedAt === 'number' ? now - body.startedAt : 0;

  if (elapsed < MIN_FORM_TIME_MS) {
    return NextResponse.json(
      { error: 'TOO_FAST' },
      { status: 400 },
    );
  }

  // Tope máximo (por si el form se dejó abierto horas y es un bot dormido)
  if (elapsed > 1000 * 60 * 60 * 6) {
    // 6 horas
    return NextResponse.json(
      { error: 'EXPIRED_FORM' },
      { status: 400 },
    );
  }

  // ============================================================
  // 🛡️ CAPA 3 — Validación básica en el server
  // ============================================================
  if (!body.tableId || !body.date || !body.name || !body.phone) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }

  if (!body.privacyAccepted) {
    return NextResponse.json(
      { error: 'PRIVACY_NOT_ACCEPTED' },
      { status: 400 },
    );
  }

  // ============================================================
  // Llamada a Supabase (service role no — usamos anon, ya que
  // la RPC es security definer y no necesita autenticación)
  // ============================================================
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { data, error } = await supabase
    .rpc('create_reservation', {
      p_table_id: body.tableId,
      p_date: body.date,
      p_name: body.name,
      p_phone: body.phone,
      p_email: null,
      p_party_size: body.partySize,
      p_time: body.time,
      p_notes: body.notes,
      p_privacy_accepted: true,
    })
    .single();

  if (error) {
    // Devolvemos el mensaje tal cual para que el frontend lo traduzca
    return NextResponse.json(
      { error: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    ...((data ?? {}) as Record<string, unknown>),
  });
}