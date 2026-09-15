import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/Footer';
import PurchaseFlow from '@/components/purchase/PurchaseFlow';
import type { EventDetail, PaymentConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getExchangeRate(): Promise<number> {
  try {
    const res = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv', {
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error('rate fetch failed');
    const data = await res.json();
    const rate = Number(data?.price);
    return !rate || isNaN(rate) ? 40 : rate;
  } catch {
    return 40;
  }
}

export default async function PurchasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: event } = await supabase
    .rpc('get_event_by_slug', { p_slug: slug })
    .single<EventDetail>();

  if (!event || !event.ticket_types || event.ticket_types.length === 0) {
    notFound();
  }

  const { data: methodsData } = await supabase
    .rpc('get_active_payment_methods')
    .single<PaymentConfig[]>();

  const methods: PaymentConfig[] = Array.isArray(methodsData)
    ? methodsData
    : [];

  const exchangeRate = await getExchangeRate();

  return (
    <>
      <SiteHeader />

      <main className="pt-24 sm:pt-28">
        <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
          <Link
            href={`/eventos/${event.slug}`}
            className="mb-6 inline-flex items-center gap-1 text-xs text-white/50 transition hover:text-white sm:text-sm"
          >
            ← Volver al evento
          </Link>

          <PurchaseFlow
            event={event}
            paymentMethods={methods}
            exchangeRate={exchangeRate}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}