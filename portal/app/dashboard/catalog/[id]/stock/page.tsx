'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { adminFetch } from '../../../../../lib/useAdminFetch';

type TxType = 'IN' | 'OUT' | 'ADJUSTMENT';

export default function StockAdjustmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [txType, setTxType] = useState<TxType>('IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetch(`/api/store/products/${id}`).then(r => r.json()),
    enabled: !!id,
  });

  const { data: txHistory = [] } = useQuery({
    queryKey: ['productTransactions', id],
    queryFn: () => fetch(`/api/store/inventory/transactions?productId=${id}&limit=20`).then(r => r.json()),
    enabled: !!id,
  });

  const adjust = useMutation({
    mutationFn: async () => {
      const qty = Number(quantity);
      if (!qty || qty <= 0) throw new Error('Quantity must be greater than 0');
      const res = await adminFetch('/api/admin/inventory', {
        method: 'POST',
        body: JSON.stringify({
          productId: Number(id),
          quantity: qty,
          transactionType: txType,
          notes: notes || undefined,
          referenceNumber: reference || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update stock');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', id] });
      qc.invalidateQueries({ queryKey: ['productTransactions', id] });
      qc.invalidateQueries({ queryKey: ['catalogProducts'] });
      setSuccess('Stock updated successfully');
      setQuantity('');
      setNotes('');
      setReference('');
      setError('');
    },
    onError: (e: Error) => { setError(e.message); setSuccess(''); },
  });

  if (isLoading) return <p className="text-gray-400">Loading...</p>;
  if (!product) return <p className="text-red-500">Product not found.</p>;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <div>
          <h1 className="text-2xl font-bold text-agron-dark">Stock Adjustment</h1>
          <p className="text-gray-500 text-sm truncate">{product.name}</p>
        </div>
      </div>

      {/* Current stock */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 flex items-center gap-5">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Current Stock</p>
          <p className={`text-4xl font-bold ${
            product.quantity_in_stock <= 0 ? 'text-red-600' :
            product.quantity_in_stock < product.minimum_stock_level ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {product.quantity_in_stock}
          </p>
          <p className="text-xs text-gray-400 mt-1">{product.unit_of_measure}</p>
        </div>
        <div className="border-l border-gray-100 pl-5 flex-1 text-sm text-gray-600 space-y-1">
          <p>Min level: <strong>{product.minimum_stock_level}</strong></p>
          <p>Availability: <strong>{product.availability}</strong></p>
          {product.supplier_name && <p>Supplier: <strong>{product.supplier_name}</strong></p>}
        </div>
      </div>

      {/* Adjustment form */}
      <form
        onSubmit={e => { e.preventDefault(); setError(''); setSuccess(''); adjust.mutate(); }}
        className="bg-white rounded-xl shadow-sm p-6 space-y-4 mb-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
          <div className="flex gap-2">
            {(['IN', 'OUT', 'ADJUSTMENT'] as TxType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTxType(t)}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                  txType === t
                    ? t === 'IN' ? 'border-green-500 bg-green-50 text-green-700'
                      : t === 'OUT' ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t === 'IN' ? '+ Restock' : t === 'OUT' ? '− Sale/Use' : '≈ Adjust'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity ({product.unit_of_measure}) *
          </label>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            min="1"
            required
            className="input"
            placeholder="e.g. 50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference # (optional)</label>
          <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="input" placeholder="Invoice or PO number" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input min-h-[60px]" placeholder="Reason for adjustment..." />
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">{success}</p>}

        <button type="submit" disabled={adjust.isPending} className="w-full bg-agron-green text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-60">
          {adjust.isPending ? 'Updating...' : 'Update Stock'}
        </button>
      </form>

      {/* Transaction history */}
      {Array.isArray(txHistory) && txHistory.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Transactions</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {txHistory.slice(0, 10).map((tx: { id: number; transaction_type: string; quantity: number; notes?: string; created_at: string }) => (
              <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  tx.transaction_type === 'IN' ? 'bg-green-100 text-green-700' :
                  tx.transaction_type === 'OUT' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {tx.transaction_type}
                </span>
                <span className="font-semibold text-sm">{tx.quantity}</span>
                <span className="text-gray-400 text-xs flex-1 truncate">{tx.notes || '—'}</span>
                <span className="text-gray-400 text-xs">{new Date(tx.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
