import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 60; // revalidar cada 1 minuto

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data } = await supabase
      .rpc('get_current_exchange_rate')
      .single<{ rate: number; updated_at: string }>();

    if (!data?.rate) {
      return NextResponse.json(
        { error: 'NO_RATE_CONFIGURED' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      rate: data.rate,
      currency: 'VES',
      updated_at: data.updated_at,
    });
  } catch (err) {
    console.error('[exchange-rate]', err);
    return NextResponse.json(
      { error: 'UNKNOWN' },
      { status: 500 },
    );
  }
}