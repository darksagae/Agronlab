'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from 'aws-amplify/auth';
import { getMyProfile, listMyChats, client } from '../../lib/queries';
import Link from 'next/link';

/* ── SVG icons ─────────────────────────────────────────── */
function PlusIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
function MarketIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  );
}
function CoffeeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.75 3.75H14.25M12 3.75V8.25M6.75 8.25h10.5a.75.75 0 01.75.75v6.75a4.5 4.5 0 01-4.5 4.5h-6a4.5 4.5 0 01-4.5-4.5V9a.75.75 0 01.75-.75zm10.5 0h1.5a2.25 2.25 0 010 4.5h-1.5" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}
function CatalogIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

/* ── Sparkline ─────────────────────────────────────────── */
function Sparkline({ points, color = '#4CAF50' }: { points: number[]; color?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) =>
    `${(i / (points.length - 1)) * 48},${18 - ((p - min) / range) * 16}`
  ).join(' ');
  return (
    <svg width={48} height={20} className="mt-2 opacity-70">
      <polyline points={coords} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Empty state illustration ──────────────────────────── */
function SeedlingIllustration() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16 mx-auto mb-3">
      <path d="M27 66h26l-3 10H30l-3-10z" fill="#e8f5e9" stroke="#4CAF50" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="40" y1="66" x2="40" y2="36" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 52 C40 52 27 44 25 32 C37 30 43 42 40 52z" fill="#4CAF50" opacity="0.6" />
      <path d="M40 44 C40 44 53 36 55 24 C43 22 37 34 40 44z" fill="#4CAF50" />
      <path d="M24 66 Q40 62 56 66" stroke="#2c5530" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ── Page ──────────────────────────────────────────────── */
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

  const { data: allListings = [] } = useQuery({
    queryKey: ['myListings'],
    queryFn: async () => {
      if (!user?.userId) return [];
      const { data } = await client.models.MarketListing.list({
        filter: { sellerSub: { eq: user.userId } },
      });
      return data ?? [];
    },
    enabled: !!user?.userId,
  });

  const { data: chatIds = [] } = useQuery({
    queryKey: ['myChats', user?.userId],
    queryFn: () => listMyChats(user!.userId),
    enabled: !!user?.userId,
  });

  const isShopOwner = profile?.role === 'BOTH';

  const activeListings = allListings.filter((l) => l.status === 'ACTIVE').length;
  const soldListings = allListings.filter((l) => l.status === 'SOLD').length;
  const pausedListings = allListings.filter((l) => l.status === 'PAUSED').length;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Welcome header — animated mesh gradient */}
      <div className="dashboard-hero-gradient rounded-2xl p-6 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23ffffff'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-green-200 text-sm font-medium">{greeting()},</p>
            <h1 className="text-2xl font-bold mt-1">
              {profile?.displayName ?? profile?.businessName ?? user?.signInDetails?.loginId ?? 'Welcome'}
            </h1>
            {profile?.businessName && profile.role === 'BOTH' && (
              <p className="text-green-200 text-sm mt-0.5">{profile.businessName}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs bg-white/20 px-2.5 py-1 rounded-full">
                {isShopOwner ? <BuildingIcon /> : <UserIcon />}
                {isShopOwner ? 'Shop Owner' : 'Seller'}
              </span>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(profile as any)?.country && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2.5 py-1 rounded-full">
                  <MapPinIcon />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(profile as any).country}
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            {isShopOwner ? <BuildingIcon /> : <UserIcon />}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Active Listings"
          value={activeListings}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="5" fill="#4CAF50" stroke="none" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>}
          href="/dashboard/store"
          colorClass="text-green-600"
          sparkPoints={[3, 5, 4, 8, 6, 9, activeListings || 4]}
          sparkColor="#4CAF50"
        />
        <StatCard
          label="Conversations"
          value={chatIds.length}
          icon={<ChatIcon />}
          href="/dashboard/messages"
          colorClass="text-blue-600"
          sparkPoints={[1, 3, 2, 5, 4, 6, chatIds.length || 3]}
          sparkColor="#3b82f6"
        />
        <StatCard
          label="Sold"
          value={soldListings}
          icon={<CheckCircleIcon />}
          href="/dashboard/store"
          colorClass="text-yellow-600"
          sparkPoints={[0, 1, 1, 2, 3, 2, soldListings || 2]}
          sparkColor="#d97706"
        />
        <StatCard
          label="Paused"
          value={pausedListings}
          icon={<PauseIcon />}
          href="/dashboard/store"
          colorClass="text-gray-500"
          sparkPoints={[2, 1, 3, 2, 1, 2, pausedListings || 1]}
          sparkColor="#9ca3af"
        />
      </div>

      {/* Quick actions — seller */}
      {!isShopOwner && (
        <>
          <div>
            <h2 className="text-base font-semibold text-gray-700 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickAction href="/dashboard/store/new" icon={<PlusIcon />} label="Post Listing" desc="List a new product" accent="green" />
              <QuickAction href="/dashboard/store" icon={<MarketIcon />} label="My Market" desc="Manage your listings" accent="green" />
              <QuickAction href="/dashboard/coffee" icon={<CoffeeIcon />} label="Coffee" desc="Post lots to coffee.agron.uk" accent="yellow" />
              <QuickAction href="/dashboard/messages" icon={<ChatIcon />} label="Messages" desc="Encrypted chat" accent="blue" />
            </div>
          </div>

          {/* Market performance */}
          <div className="glass-card-light rounded-2xl p-6 card-lift">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Your Market Performance</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-agron-green">{activeListings}</p>
                <p className="text-xs text-gray-500 mt-1">Active Listings</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-500">{chatIds.length}</p>
                <p className="text-xs text-gray-500 mt-1">Buyer Inquiries</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-500">{soldListings}</p>
                <p className="text-xs text-gray-500 mt-1">Items Sold</p>
              </div>
            </div>
            {allListings.length === 0 && (
              <div className="mt-6 text-center py-6 glass-card-light rounded-xl">
                <SeedlingIllustration />
                <p className="text-sm font-medium text-agron-dark">No listings yet</p>
                <p className="text-xs text-gray-500 mt-1">Post your first product to start reaching buyers.</p>
                <Link href="/dashboard/store/new" className="inline-flex items-center gap-1.5 mt-3 bg-agron-green text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                  <PlusIcon /> Post your first listing
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* Quick actions — shop owner */}
      {isShopOwner && (
        <>
          <div>
            <h2 className="text-base font-semibold text-gray-700 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickAction href="/dashboard/catalog/new" icon={<PlusIcon />} label="Add Product" desc="Add to your catalog" accent="green" />
              <QuickAction href="/dashboard/catalog" icon={<CatalogIcon />} label="Catalog" desc="Manage products" accent="green" />
              <QuickAction href="/dashboard/coffee" icon={<CoffeeIcon />} label="Coffee" desc="Post lots to coffee.agron.uk" accent="yellow" />
              <QuickAction href="/dashboard/messages" icon={<ChatIcon />} label="Messages" desc="Chat with buyers" accent="blue" />
            </div>
          </div>

          {/* Store overview */}
          <div className="glass-card-light rounded-2xl p-6 card-lift">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-700">Store Overview</h2>
              <Link href="/dashboard/my-store" className="text-xs text-agron-green hover:underline">
                Manage store →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-agron-green">{activeListings}</p>
                <p className="text-xs text-gray-500 mt-1">Active Products</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-500">{chatIds.length}</p>
                <p className="text-xs text-gray-500 mt-1">Conversations</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-500">0</p>
                <p className="text-xs text-gray-500 mt-1">Low Stock Alerts</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent conversations */}
      {chatIds.length > 0 && (
        <div className="glass-card-light rounded-2xl p-6 card-lift">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">Recent Conversations</h2>
            <Link href="/dashboard/messages" className="text-xs text-agron-green hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {chatIds.slice(0, 3).map((chatId) => (
              <Link
                key={chatId}
                href={`/dashboard/messages/${chatId}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-agron-light transition-colors"
              >
                <div className="w-9 h-9 bg-agron-light rounded-full flex items-center justify-center text-agron-green shrink-0">
                  <ChatIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">Conversation</p>
                  <p className="text-xs text-gray-400 truncate">{chatId.slice(0, 20)}…</p>
                </div>
                <span className="text-xs text-agron-green shrink-0">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── StatCard ──────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon,
  href,
  colorClass,
  sparkPoints,
  sparkColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  colorClass: string;
  sparkPoints: number[];
  sparkColor: string;
}) {
  return (
    <Link href={href} className="glass-card-light rounded-xl p-4 card-lift block">
      <div className="flex items-center gap-2 mb-1">
        <span className={`${colorClass}`}>{icon}</span>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      <Sparkline points={sparkPoints} color={sparkColor} />
    </Link>
  );
}

/* ── QuickAction ───────────────────────────────────────── */
function QuickAction({
  href,
  icon,
  label,
  desc,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  accent: string;
}) {
  const accentMap: Record<string, string> = {
    green: 'hover:border-agron-green text-agron-green',
    blue: 'hover:border-blue-400 text-blue-500',
    yellow: 'hover:border-yellow-400 text-yellow-600',
  };
  return (
    <Link
      href={href}
      className={`glass-card-light rounded-xl p-4 card-lift border-2 border-transparent ${accentMap[accent] ?? ''}`}
    >
      <div className="mb-2">{icon}</div>
      <p className="font-semibold text-gray-800 text-sm">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </Link>
  );
}
