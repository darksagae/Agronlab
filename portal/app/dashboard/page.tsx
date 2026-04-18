'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from 'aws-amplify/auth';
import { getMyProfile, listMarketListings, listMyChats } from '../../lib/queries';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: profile } = useQuery({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
    enabled: !!user,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listMarketListings(),
    enabled: !!user,
  });

  const { data: chatIds = [] } = useQuery({
    queryKey: ['myChats', user?.userId],
    queryFn: () => listMyChats(user!.userId),
    enabled: !!user?.userId,
  });

  const stats = [
    { label: 'Active Listings', value: listings.filter((l) => l.status === 'ACTIVE').length, href: '/dashboard/store', color: 'bg-green-100 text-green-800' },
    { label: 'Conversations', value: chatIds.length, href: '/dashboard/messages', color: 'bg-blue-100 text-blue-800' },
    { label: 'Sold Items', value: listings.filter((l) => l.status === 'SOLD').length, href: '/dashboard/store', color: 'bg-yellow-100 text-yellow-800' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-agron-dark">
          Welcome back, {profile?.displayName ?? user?.signInDetails?.loginId ?? 'Merchant'}
        </h1>
        <p className="text-gray-500 mt-1">
          Role: <span className="font-medium">{profile?.role ?? 'Not set'}</span>
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction href="/dashboard/store/new" icon="📦" label="New Listing" desc="Post a product to the market" />
        <QuickAction href="/dashboard/market" icon="🛒" label="Browse Market" desc="Find buyers and sellers" />
        <QuickAction href="/dashboard/messages" icon="💬" label="Messages" desc="Encrypted merchant chat" />
        <QuickAction href="/dashboard/store" icon="🏪" label="My Store" desc="Manage your listings" />
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label, desc }: { href: string; icon: string; label: string; desc: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex gap-3 items-start">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </Link>
  );
}
