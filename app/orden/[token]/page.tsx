import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/Footer';
import OrderDetailView from '@/components/purchase/OrderDetailView';
import type { OrderDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function OrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();

  const { data: order } = await supabase
    .rpc('get_order_by_access_token', { p_token: token })
    .single<OrderDetail>();

  if (!order) notFound();

  return (
    <>
      <SiteHeader />
      <main className="pt-24 sm:pt-28">
        <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
          <Link
            href="/"
            className="mb-6 inline-block text-xs text-white/50 hover:text-white sm:text-sm"
          >
            ← Inicio
          </Link>

          <OrderDetailView order={order} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}