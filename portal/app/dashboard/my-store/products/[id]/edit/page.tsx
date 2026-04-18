'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyStore, listStoreProducts, updateStoreProduct } from '../../../../../../lib/queries';
import { useRouter, useParams } from 'next/navigation';

const CATEGORIES = ['Seeds', 'Fertilizers', 'Herbicides', 'Fungicides', 'Pesticides', 'Tools', 'Irrigation', 'Other'];
const UNITS = ['kg', 'g', 'litre', 'ml', 'bag', 'sack', 'piece', 'dozen', 'tray', 'bundle'];

export default function EditStoreProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    priceLabel: '',
    sellingPrice: '',
    unit: '',
    quantity: '',
    inStock: true,
  });
  const [ready, setReady] = useState(false);

  const { data: store, isLoading: loadingStore } = useQuery({
    queryKey: ['myStore'],
    queryFn: getMyStore,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['myStoreProducts', store?.id],
    queryFn: () => listStoreProducts(store!.id),
    enabled: !!store?.id,
  });

  const product = products.find(p => p.id === productId);

  useEffect(() => {
    if (product && !ready) {
      setForm({
        name: product.name ?? '',
        description: product.description ?? '',
        category: product.category ?? '',
        priceLabel: product.priceLabel ?? '',
        sellingPrice: product.sellingPrice != null ? String(product.sellingPrice) : '',
        unit: product.unit ?? '',
        quantity: product.quantity != null ? String(product.quantity) : '',
        inStock: product.inStock ?? true,
      });
      setReady(true);
    }
  }, [product, ready]);

  const save = useMutation({
    mutationFn: () =>
      updateStoreProduct(productId, {
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        priceLabel: form.priceLabel || undefined,
        sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : undefined,
        unit: form.unit || undefined,
        quantity: form.quantity ? parseInt(form.quantity) : 0,
        inStock: form.inStock,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myStoreProducts'] });
      router.push('/dashboard/my-store/products');
    },
    onError: (e: Error) => setError(e.message),
  });

  const set = (key: string, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }));

  if (loadingStore || loadingProducts) return <p className="text-gray-400">Loading...</p>;

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Product not found.</p>
        <button onClick={() => router.push('/dashboard/my-store/products')} className="text-agron-green underline">
          Back to products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.push('/dashboard/my-store/products')} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-agron-dark">Edit Product</h1>
      </div>

      <form
        onSubmit={e => { e.preventDefault(); setError(''); save.mutate(); }}
        className="bg-white rounded-xl shadow-sm p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select value={form.unit} onChange={e => set('unit', e.target.value)} className="input">
              <option value="">Select unit</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Label</label>
            <input
              type="text"
              value={form.priceLabel}
              onChange={e => set('priceLabel', e.target.value)}
              className="input"
              placeholder="UGX 95,000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.sellingPrice}
              onChange={e => set('sellingPrice', e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="0"
              value={form.quantity}
              onChange={e => set('quantity', e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={e => set('inStock', e.target.checked)}
                className="w-4 h-4 accent-agron-green"
              />
              <span className="text-sm font-medium text-gray-700">In Stock</span>
            </label>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/my-store/products')}
            className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={save.isPending}
            className="flex-1 bg-agron-green text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-60"
          >
            {save.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
