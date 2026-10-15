import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 👈 ESTA LÍNEA ES LA CLAVE
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );

    const { data, error } = await supabase
      .rpc('get_current_exchange_rate')
      .single<{ rate: number; updated_at: string }>();

    if (error || !data?.rate) {
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