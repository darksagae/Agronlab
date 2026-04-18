'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { adminFetch } from '../../../lib/useAdminFetch';

interface StockItem {
  id: number;
  name: string;
  category_name: string;
  quantity_in_stock: number;
  minimum_stock_level: number;
  unit_of_measure: string;
  availability: string;
}

interface Alert {
  id: number;
  product_id: number;
  product_name: string;
  alert_type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRY_WARNING';
  message: string;
  created_at: string;
}

interface Analytics {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export default function InventoryPage() {
  const qc = useQueryClient();

  const { data: status = [], isLoading: loadingStatus } = useQuery<StockItem[]>({
    queryKey: ['inventoryStatus'],
    queryFn: () => adminFetch('/api/admin/inventory?type=status').then(r => r.json()),
  });

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery<Alert[]>({
    queryKey: ['inventoryAlerts'],
    queryFn: () => adminFetch('/api/admin/inventory?type=alerts').then(r => r.json()),
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ['inventoryAnalytics'],
    queryFn: () => adminFetch('/api/admin/inventory?type=analytics').then(r => r.json()),
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await adminFetch(`/api/store/inventory/alerts/${alertId}/resolve`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to resolve');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventoryAlerts'] }),
  });

  const lowStock = status.filter(p => p.quantity_in_stock > 0 && p.quantity_in_stock < p.minimum_stock_level);
  const outOfStock = status.filter(p => p.quantity_in_stock <= 0 && p.availability !== 'Discontinued');

  return (
    <div>
      <h1 className="text-2xl font-bold text-agron-dark mb-6">Inventory Overview</h1>

      {/* Analytics strip */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Products" value={analytics.totalProducts} color="text-gray-800" />
          <StatCard label="Low Stock" value={analytics.lowStockCount} color="text-yellow-600" />
          <StatCard label="Out of Stock" value={analytics.outOfStockCount} color="text-red-600" />
          <StatCard label="Active Alerts" value={alerts.length} color="text-orange-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active alerts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Active Alerts</h2>
            {loadingAlerts && <span className="text-xs text-gray-400">Loading...</span>}
          </div>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {alerts.length === 0 && !loadingAlerts && (
              <p className="text-gray-400 text-sm text-center py-8">No active alerts</p>
            )}
            {alerts.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                  a.alert_type === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-700' :
                  a.alert_type === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {a.alert_type.replace('_', ' ')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{a.product_name}</p>
                  <p className="text-xs text-gray-400">{a.message}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/dashboard/catalog/${a.product_id}/stock`} className="text-xs text-agron-green hover:underline">
                    Restock
                  </Link>
                  <button
                    onClick={() => resolveAlert.mutate(a.id)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Out of stock */}
        <section>
          <h2 className="font-semibold text-gray-700 mb-3">Out of Stock ({outOfStock.length})</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {outOfStock.length === 0 && !loadingStatus && (
              <p className="text-gray-400 text-sm text-center py-8">All products are in stock</p>
            )}
            {outOfStock.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                <span className="flex-1 text-sm text-gray-800 truncate">{p.name}</span>
                <Link href={`/dashboard/catalog/${p.id}/stock`} className="text-xs text-agron-green hover:underline shrink-0">
                  Restock
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Low stock */}
        <section className="lg:col-span-2">
          <h2 className="font-semibold text-gray-700 mb-3">Low Stock ({lowStock.length})</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-right">Stock</th>
                  <th className="px-4 py-2 text-right">Min Level</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStock.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-8">No low-stock products</td></tr>
                )}
                {lowStock.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-xs">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{p.category_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-yellow-600">{p.quantity_in_stock}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{p.minimum_stock_level}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/catalog/${p.id}/stock`} className="text-xs text-agron-green hover:underline">
                        Restock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
