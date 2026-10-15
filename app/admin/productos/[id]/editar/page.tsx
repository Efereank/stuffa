import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireFullAccess } from '@/lib/auth';
import AdminHeader from '@/components/admin/AdminHeader';
import ProductForm from '@/components/admin/ProductForm';

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

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await requireFullAccess();
  const supabase = await createClient();

  const { data } = await supabase
    .rpc('admin_list_consumption_products')
    .single<ProductRow[]>();

  const products: ProductRow[] = Array.isArray(data) ? data : [];
  const product = products.find((p) => p.id === id);

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/admin/productos"
          className="mb-4 inline-block text-xs text-white/50 transition hover:text-white"
        >
          ← Volver a productos
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            Editar producto
          </h1>
          <p className="mt-1 text-sm text-white/50">{product.name}</p>
        </div>

        <ProductForm
          mode="edit"
          initialData={{
            id: product.id,
            name: product.name,
            description: product.description ?? '',
            category: product.category,
            base_price_usd: product.base_price_usd,
            image_url: product.image_url,
            is_recommended: product.is_recommended,
            is_active: product.is_active,
            sort_order: product.sort_order,
          }}
        />
      </main>
    </div>
  );
}