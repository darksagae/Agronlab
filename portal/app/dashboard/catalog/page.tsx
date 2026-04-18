'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { adminFetch } from '../../../lib/useAdminFetch';

interface Product {
  id: number;
  name: string;
  category_name: string;
  price: string;
  selling_price: number;
  quantity_in_stock: number;
  availability: string;
  minimum_stock_level: number;
}

interface Category {
  id: number;
  name: string;
  display_name: string;
}

export default function CatalogPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/store/categories').then(r => r.json()),
  });

  const { data, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['catalogProducts', search, category, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
      });
      const res = await fetch(`/api/store/products?${params}`);
      const products: Product[] = await res.json();
      return { products, total: products.length };
    },
  });

  const discontinue = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to discontinue product');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogProducts'] }),
  });

  const products = data?.products ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-agron-dark">Product Catalog</h1>
        <Link
          href="/dashboard/catalog/new"
          className="bg-agron-green text-white px-5 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search products..."
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agron-green w-64"
        />
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(0); }}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agron-green"
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.display_name}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-gray-400 text-sm py-8 text-center">Loading catalog...</p>}

      {!isLoading && (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{p.category_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-agron-dark font-medium">
                      {p.selling_price ? `UGX ${Number(p.selling_price).toLocaleString()}` : p.price || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${
                        p.quantity_in_stock <= 0 ? 'text-red-600' :
                        p.quantity_in_stock < p.minimum_stock_level ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {p.quantity_in_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        p.availability === 'In Stock' ? 'bg-green-100 text-green-700' :
                        p.availability === 'Discontinued' ? 'bg-gray-100 text-gray-500' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.availability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/dashboard/catalog/${p.id}/stock`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Stock
                        </Link>
                        <Link
                          href={`/dashboard/catalog/${p.id}/edit`}
                          className="text-xs text-agron-green hover:underline"
                        >
                          Edit
                        </Link>
                        {p.availability !== 'Discontinued' && (
                          <button
                            onClick={() => {
                              if (confirm(`Discontinue "${p.name}"?`)) discontinue.mutate(p.id);
                            }}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Discontinue
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && (
              <p className="text-center text-gray-400 py-12">No products found.</p>
            )}
          </div>

          {/* Pagination */}
          <div className="flex gap-2 justify-end mt-4">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <span className="px-4 py-2 text-sm text-gray-500">Page {page + 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={products.length < PAGE_SIZE}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
