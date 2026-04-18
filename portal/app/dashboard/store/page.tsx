'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from 'aws-amplify/auth';
import { listMarketListings, client } from '../../../lib/queries';
import Link from 'next/link';

export default function StorePage() {
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: getCurrentUser });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listMarketListings(),
    enabled: !!user,
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'PAUSED' }) => {
      const { data, errors } = await client.models.MarketListing.update({ id, status });
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myListings'] }),
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      const { errors } = await client.models.MarketListing.delete({ id });
      if (errors?.length) throw new Error(errors[0].message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myListings'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-agron-dark">My Store</h1>
        <Link
          href="/dashboard/store/new"
          className="bg-agron-green text-white px-5 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          + New Listing
        </Link>
      </div>

      {isLoading && <p className="text-gray-400">Loading listings...</p>}

      {!isLoading && listings.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-5xl mb-3">📦</p>
          <p className="text-gray-600 font-medium mb-4">No listings yet</p>
          <Link href="/dashboard/store/new" className="text-agron-green underline text-sm">
            Post your first product
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-agron-light h-36 flex items-center justify-center">
              <span className="text-4xl">🌾</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-800 truncate">{listing.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                  listing.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  listing.status === 'SOLD' ? 'bg-gray-100 text-gray-500' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {listing.status}
                </span>
              </div>
              <p className="text-agron-green font-bold mt-1">{listing.priceLabel}</p>
              <p className="text-xs text-gray-400 mt-1">{listing.category} · {listing.unit}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => toggleStatus.mutate({ id: listing.id, status: listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })}
                  className="flex-1 text-xs border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition-colors"
                >
                  {listing.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this listing?')) deleteListing.mutate(listing.id);
                  }}
                  className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
