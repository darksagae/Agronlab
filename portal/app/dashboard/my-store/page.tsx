'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyStore, upsertStore } from '../../../lib/queries';
import Link from 'next/link';

export default function MyStorePage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', tagline: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: store, isLoading } = useQuery({
    queryKey: ['myStore'],
    queryFn: getMyStore,
  });

  useEffect(() => {
    if (store) {
      setForm({ name: store.name ?? '', tagline: store.tagline ?? '' });
    }
  }, [store]);

  const save = useMutation({
    mutationFn: () =>
      upsertStore({
        name: form.name,
        tagline: form.tagline,
        status: store ? (store.status as 'ACTIVE' | 'PENDING') : 'PENDING',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myStore'] });
      setEditing(false);
      setSuccess('Store profile saved!');
      setError('');
    },
    onError: (e: Error) => setError(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: () =>
      upsertStore({ status: store?.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myStore'] }),
  });

  if (isLoading) return <p className="text-gray-400">Loading...</p>;

  const isNew = !store;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-agron-dark mb-6">My Store</h1>

      {!store && !editing && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center mb-6">
          <p className="text-5xl mb-4">🏪</p>
          <p className="text-gray-700 font-semibold text-lg mb-2">Register your store</p>
          <p className="text-gray-400 text-sm mb-6">
            Your store will appear as a round icon in the AGRON mobile app.
            Customers can browse your products by tapping your icon.
          </p>
          <button
            onClick={() => setEditing(true)}
            className="bg-agron-green text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Register Store
          </button>
        </div>
      )}

      {store && !editing && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start gap-5">
            {/* Store icon preview */}
            <div className="w-20 h-20 rounded-full bg-agron-light flex items-center justify-center shrink-0 text-3xl font-bold text-agron-dark border-2 border-agron-green">
              {store.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-800">{store.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  store.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {store.status}
                </span>
              </div>
              {store.tagline && <p className="text-gray-500 text-sm">{store.tagline}</p>}
              <p className="text-xs text-gray-400 mt-2">Store ID: {store.id}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-5 flex-wrap">
            <button
              onClick={() => setEditing(true)}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={() => toggleStatus.mutate()}
              disabled={toggleStatus.isPending}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                store.status === 'ACTIVE'
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              }`}
            >
              {toggleStatus.isPending ? '...' : store.status === 'ACTIVE' ? 'Pause Store' : 'Publish Store'}
            </button>
            <Link
              href="/dashboard/my-store/products"
              className="bg-agron-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Manage Products →
            </Link>
          </div>
        </div>
      )}

      {editing && (
        <form
          onSubmit={e => { e.preventDefault(); setError(''); save.mutate(); }}
          className="bg-white rounded-xl shadow-sm p-6 space-y-4"
        >
          <h2 className="font-semibold text-gray-700">{isNew ? 'Register Your Store' : 'Edit Store Profile'}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="input"
              placeholder="e.g. Green Valley Seeds"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              className="input"
              placeholder="Quality seeds for every season"
              maxLength={80}
            />
          </div>

          <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
            After registering, your store will appear as a round icon in the AGRON mobile app once you set its status to <strong>Active</strong>.
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            {!isNew && (
              <button type="button" onClick={() => setEditing(false)} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            )}
            <button type="submit" disabled={save.isPending} className="flex-1 bg-agron-green text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-60">
              {save.isPending ? 'Saving...' : isNew ? 'Register Store' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {success && !editing && (
        <p className="text-green-600 text-sm bg-green-50 rounded-lg px-4 py-3">{success}</p>
      )}

      {store && (
        <div className="mt-6 bg-agron-light rounded-xl p-5">
          <p className="text-sm font-semibold text-agron-dark mb-1">How it works</p>
          <p className="text-xs text-gray-600">
            Once your store is <strong>Active</strong>, it appears as a round icon in the AGRON app's store tab.
            Customers tap your icon to browse your products. Add products from{' '}
            <Link href="/dashboard/my-store/products" className="text-agron-green underline">Manage Products</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
