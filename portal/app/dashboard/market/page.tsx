'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listMarketListings } from '../../../lib/queries';
import Link from 'next/link';

const CATEGORIES = ['All', 'Fertilizers', 'Fungicides', 'Herbicides', 'Seeds', 'Nursery Bed', 'Organic Chemicals', 'Produce', 'Other'];

export default function MarketPage() {
  const [category, setCategory] = useState('All');

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['marketListings', category],
    queryFn: () => listMarketListings(category === 'All' ? undefined : { category }),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-agron-dark">Market</h1>
        <p className="text-gray-500 text-sm mt-1">Browse listings from all merchants. Message a seller to start a deal.</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === c
                ? 'bg-agron-green text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-agron-green'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-gray-400">Loading market...</p>}

      {!isLoading && listings.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-gray-500">No listings in this category yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-agron-light h-32 flex items-center justify-center">
              <span className="text-4xl">🌾</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 truncate">{listing.title}</h3>
              <p className="text-agron-green font-bold mt-0.5">{listing.priceLabel}</p>
              <p className="text-xs text-gray-400 mt-0.5">{listing.category} · {listing.unit}</p>
              {listing.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{listing.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">Seller: {listing.sellerName ?? 'Anonymous'}</p>
              <Link
                href={`/dashboard/messages?with=${listing.sellerSub}&listing=${listing.id}`}
                className="mt-3 w-full text-center block bg-agron-light text-agron-dark text-sm font-medium py-2 rounded-lg hover:bg-green-100 transition-colors"
              >
                Message Seller
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
