'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from 'aws-amplify/auth';
import { client } from '../../../../lib/queries';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Fertilizers', 'Fungicides', 'Herbicides', 'Seeds', 'Nursery Bed', 'Organic Chemicals', 'Produce', 'Other'];

export default function NewListingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    priceLabel: '',
    unit: 'kg',
  });
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: async () => {
      const user = await getCurrentUser();
      const { data, errors } = await client.models.MarketListing.create({
        ...form,
        sellerSub: user.userId,
        status: 'ACTIVE',
        imageKeysJson: '[]',
      });
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myListings'] });
      router.push('/dashboard/store');
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.priceLabel.trim()) {
      setError('Title and price are required');
      return;
    }
    setError('');
    create.mutate();
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-agron-dark mb-6">New Listing</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <Field label="Product Title">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            placeholder="e.g. Grade A Maize — 50kg bags"
            required
          />
        </Field>
        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="input"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <div className="flex gap-3">
          <Field label="Price" className="flex-1">
            <input
              type="text"
              value={form.priceLabel}
              onChange={(e) => setForm({ ...form, priceLabel: e.target.value })}
              className="input"
              placeholder="e.g. UGX 95,000"
              required
            />
          </Field>
          <Field label="Unit" className="w-28">
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="input"
              placeholder="kg"
            />
          </Field>
        </div>
        <Field label="Description (optional)">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input min-h-[80px]"
            placeholder="Describe your product — quality, origin, availability..."
          />
        </Field>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="flex-1 bg-agron-green text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"
          >
            {create.isPending ? 'Posting...' : 'Post Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
