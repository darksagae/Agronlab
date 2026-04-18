'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyStore, createStoreProduct } from '../../../../../lib/queries';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = ['Seeds', 'Fertilizers', 'Herbicides', 'Fungicides', 'Pesticides', 'Tools', 'Irrigation', 'Other'];
const UNITS = ['kg', 'g', 'litre', 'ml', 'bag', 'sack', 'piece', 'dozen', 'tray', 'bundle'];

export default function NewStoreProductPage() {
  const router = useRouter();
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

  const { data: store, isLoading: loadingStore } = useQuery({
    queryKey: ['myStore'],
    queryFn: getMyStore,
  });

  const create = useMutation({
    mutationFn: () =>
      createStoreProduct({
        storeId: store!.id,
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

  if (loadingStore) return <p className="text-gray-400">Loading...</p>;

  if (!store) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Register your store first.</p>
        <Link href="/dashboard/my-store" className="bg-agron-green text-white px-6 py-2 rounded-lg">
          Register Store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.push('/dashboard/my-store/products')} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-agron-dark">Add Product</h1>
      </div>

      <form
        onSubmit={e => { e.preventDefault(); setError(''); create.mutate(); }}
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
            placeholder="e.g. Hybrid Maize Seeds 2kg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className="input"
            placeholder="Short product description..."
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (number)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.sellingPrice}
              onChange={e => set('sellingPrice', e.target.value)}
              className="input"
              placeholder="95000"
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
              placeholder="0"
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
            disabled={create.isPending}
            className="flex-1 bg-agron-green text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-60"
          >
            {create.isPending ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
