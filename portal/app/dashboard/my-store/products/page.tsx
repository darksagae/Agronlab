'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyStore, listStoreProducts, deleteStoreProduct, updateStoreProduct } from '../../../../lib/queries';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyStoreProductsPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: store, isLoading: loadingStore } = useQuery({
    queryKey: ['myStore'],
    queryFn: getMyStore,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['myStoreProducts', store?.id],
    queryFn: () => listStoreProducts(store!.id),
    enabled: !!store?.id,
  });

  const toggleStock = useMutation({
    mutationFn: ({ id, inStock }: { id: string; inStock: boolean }) =>
      updateStoreProduct(id, { inStock: !inStock }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myStoreProducts'] }),
  });

  const remove = useMutation({
    mutationFn: deleteStoreProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myStoreProducts'] }),
  });

  if (loadingStore) return <p className="text-gray-400">Loading...</p>;

  if (!store) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">You need to register your store first.</p>
        <Link href="/dashboard/my-store" className="bg-agron-green text-white px-6 py-2 rounded-lg">
          Register Store
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.push('/dashboard/my-store')} className="text-gray-400 hover:text-gray-600">←</button>
            <h1 className="text-2xl font-bold text-agron-dark">Products</h1>
          </div>
          <p className="text-gray-500 text-sm">{store.name}</p>
        </div>
        <Link
          href="/dashboard/my-store/products/new"
          className="bg-agron-green text-white px-5 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          + Add Product
        </Link>
      </div>

      {isLoading && <p className="text-gray-400 text-sm py-8 text-center">Loading products...</p>}

      {!isLoading && products.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-600 font-medium mb-2">No products yet</p>
          <p className="text-gray-400 text-sm mb-5">Add products to your store — they'll appear in the AGRON app.</p>
          <Link href="/dashboard/my-store/products/new" className="text-agron-green underline text-sm">
            Add your first product
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-agron-light h-28 flex items-center justify-center">
              <span className="text-3xl">🌾</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-gray-800 text-sm truncate flex-1">{p.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {p.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              {p.priceLabel && <p className="text-agron-green font-bold text-sm">{p.priceLabel}</p>}
              <p className="text-xs text-gray-400 mt-0.5">{p.category ?? '—'} · {p.unit ?? '—'}</p>
              {p.quantity !== null && <p className="text-xs text-gray-400">Qty: {p.quantity}</p>}

              <div className="flex gap-2 mt-3">
                <Link
                  href={`/dashboard/my-store/products/${p.id}/edit`}
                  className="flex-1 text-center text-xs border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50"
                >
                  Edit
                </Link>
                <button
                  onClick={() => toggleStock.mutate({ id: p.id, inStock: p.inStock ?? true })}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
                >
                  {p.inStock ? 'Mark Out' : 'Mark In'}
                </button>
                <button
                  onClick={() => { if (confirm('Delete product?')) remove.mutate(p.id); }}
                  className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
