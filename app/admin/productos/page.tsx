import { createClient } from '@/lib/supabase/server';
import { requireFullAccess } from '@/lib/auth';
import AdminHeader from '@/components/admin/AdminHeader';
import ProductsManager from '@/components/admin/ProductsManager';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  base_price_usd: number;
  image_url: string | null;
  is_recommended: boolean;
  is_active: boolean;
  sort_order: number;
}

export default async function AdminProductosPage() {
  await requireFullAccess();
  const supabase = await createClient();

  const { data } = await supabase
    .rpc('admin_list_consumption_products')
    .single<ProductRow[]>();

  const products: ProductRow[] = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="mb-4 inline-block text-xs text-white/50 transition hover:text-white"
        >
          ← Volver a eventos
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            Productos de consumo
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Gestiona el catálogo de licores, snacks y combos disponibles para
            los clientes.
          </p>
        </div>

        <ProductsManager products={products} />
      </main>
    </div>
  );
}