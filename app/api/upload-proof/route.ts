import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'MISSING_FILE' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'INVALID_FILE_TYPE' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Nombre único
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const path = `proofs/${filename}`;

    const buffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('[upload-proof]', error);
      return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('[upload-proof]', err);
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500 });
  }
}