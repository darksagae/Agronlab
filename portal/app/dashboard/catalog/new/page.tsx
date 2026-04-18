'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { adminFetch } from '../../../../lib/useAdminFetch';

interface Category { id: number; name: string; display_name: string; }

const UNITS = ['bags', 'kg', 'litres', 'pieces', 'boxes', 'tonnes', 'g', 'ml'];

export default function NewProductPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    category_id: '',
    description: '',
    selling_price: '',
    cost_price: '',
    quantity_in_stock: '0',
    unit_of_measure: 'bags',
    minimum_stock_level: '10',
    specifications: '',
    features: '',
    usage_instructions: '',
    safety_info: '',
    storage_instructions: '',
    supplier_name: '',
    availability: 'In Stock',
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/store/categories').then(r => r.json()),
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await adminFetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          category_id: Number(form.category_id),
          selling_price: Number(form.selling_price),
          cost_price: Number(form.cost_price),
          quantity_in_stock: Number(form.quantity_in_stock),
          minimum_stock_level: Number(form.minimum_stock_level),
          price: form.selling_price ? `UGX ${Number(form.selling_price).toLocaleString()}` : '',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create product');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogProducts'] });
      router.push('/dashboard/catalog');
    },
    onError: (e: Error) => setError(e.message),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-agron-dark mb-6">Add New Product</h1>

      <form
        onSubmit={e => { e.preventDefault(); setError(''); create.mutate(); }}
        className="bg-white rounded-xl shadow-sm p-6 space-y-5"
      >
        {/* Basic info */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Info</h2>
          <div className="space-y-3">
            <Field label="Product Name *">
              <input type="text" value={form.name} onChange={set('name')} required className="input" placeholder="e.g. NPK 17-17-17 Fertilizer 50kg" />
            </Field>
            <Field label="Category *">
              <select value={form.category_id} onChange={set('category_id')} required className="input">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
              </select>
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={set('description')} className="input min-h-[80px]" placeholder="Product description..." />
            </Field>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pricing</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Selling Price (UGX) *">
              <input type="number" value={form.selling_price} onChange={set('selling_price')} required min="0" className="input" placeholder="95000" />
            </Field>
            <Field label="Cost Price (UGX)">
              <input type="number" value={form.cost_price} onChange={set('cost_price')} min="0" className="input" placeholder="70000" />
            </Field>
          </div>
        </section>

        {/* Inventory */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Inventory</h2>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Initial Stock">
              <input type="number" value={form.quantity_in_stock} onChange={set('quantity_in_stock')} min="0" className="input" />
            </Field>
            <Field label="Unit">
              <select value={form.unit_of_measure} onChange={set('unit_of_measure')} className="input">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Min Stock Level">
              <input type="number" value={form.minimum_stock_level} onChange={set('minimum_stock_level')} min="0" className="input" />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Supplier Name">
              <input type="text" value={form.supplier_name} onChange={set('supplier_name')} className="input" placeholder="Supplier company name" />
            </Field>
          </div>
        </section>

        {/* Details */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Product Details</h2>
          <div className="space-y-3">
            <Field label="Specifications">
              <textarea value={form.specifications} onChange={set('specifications')} className="input min-h-[60px]" placeholder="NPK ratio, active ingredients, etc." />
            </Field>
            <Field label="Usage Instructions">
              <textarea value={form.usage_instructions} onChange={set('usage_instructions')} className="input min-h-[60px]" placeholder="How to apply..." />
            </Field>
            <Field label="Safety Info">
              <textarea value={form.safety_info} onChange={set('safety_info')} className="input min-h-[60px]" placeholder="Precautions, PPE required..." />
            </Field>
            <Field label="Storage Instructions">
              <input type="text" value={form.storage_instructions} onChange={set('storage_instructions')} className="input" placeholder="Store in cool, dry place..." />
            </Field>
          </div>
        </section>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={create.isPending} className="flex-1 bg-agron-green text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-60">
            {create.isPending ? 'Saving...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
