import Link from 'next/link';
import { requireFullAccess } from '@/lib/auth';
import AdminHeader from '@/components/admin/AdminHeader';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireFullAccess();

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
            Nuevo producto
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Añade un producto al catálogo de consumo.
          </p>
        </div>

        <ProductForm mode="create" />
      </main>
    </div>
  );
}