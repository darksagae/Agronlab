'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handshake, Plus, MapPin, Lock, Loader2, Package, ChevronRight, TrendingUp, Globe, Home } from 'lucide-react';
import { listActiveListings, createListing, type MarketListing } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const CATEGORIES = ['All', 'Grains', 'Legumes', 'Vegetables', 'Fruits', 'Cash Crops', 'Fertilizers', 'Seeds'];
type MarketTab = 'local' | 'international';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Grains:      { bg: 'rgba(0,232,122,0.08)', text: '#00E87A' },
  Legumes:     { bg: 'rgba(139,195,74,0.1)', text: '#8BC34A' },
  'Cash Crops':{ bg: 'rgba(255,184,0,0.08)', text: '#FFB800' },
  Vegetables:  { bg: 'rgba(0,221,184,0.08)', text: '#00DDB8' },
  Fruits:      { bg: 'rgba(233,30,99,0.08)', text: '#E91E63' },
  Fertilizers: { bg: 'rgba(156,39,176,0.08)',text: '#CE93D8' },
  Seeds:       { bg: 'rgba(63,81,181,0.08)', text: '#7986CB' },
  Other:       { bg: 'rgba(255,255,255,0.05)',text: '#5A7A5E' },
};

function LockedListingCard() {
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 relative overflow-hidden"
      style={{ border: '1px solid rgba(255,184,0,0.12)' }}
    >
      <div className="absolute inset-0 backdrop-blur-sm rounded-2xl" style={{ background: 'rgba(2,10,4,0.6)' }} />
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.08)' }}>
          <Lock size={16} style={{ color: '#FFB800' }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: '#DCF5E2' }}>International Listing</p>
          <p className="text-xs" style={{ color: '#3D6645' }}>Sign in to view international sellers</p>
        </div>
        <Link href="/account/login" className="ml-auto">
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(255,184,0,0.1)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.2)' }}>
            Sign in
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

function ListingCard({ listing }: { listing: MarketListing }) {
  const cat = listing.category ?? 'Other';
  const badge = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
  const timeAgo = listing.createdAt
    ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round((new Date(listing.createdAt).getTime() - Date.now()) / 3600000),
        'hour',
      )
    : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(0,232,122,0.08)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="glass rounded-2xl p-5 cursor-pointer"
      style={{ border: '1px solid rgba(0,232,122,0.07)' }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: badge.bg, border: `1px solid ${badge.text}20` }}
        >
          <Package size={20} style={{ color: badge.text }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-sm" style={{ color: '#DCF5E2' }}>{listing.title}</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.text }}>{cat}</span>
          </div>
          {listing.description && (
            <p className="text-xs leading-relaxed mb-2 line-clamp-2" style={{ color: '#3D6645' }}>{listing.description}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {listing.sellerName && (
              <span className="text-xs" style={{ color: '#5A7A5E' }}>{listing.sellerName}</span>
            )}
            {listing.country && (
              <span className="flex items-center gap-1 text-xs" style={{ color: '#3D6645' }}>
                <MapPin size={9} />{listing.country}
              </span>
            )}
            {timeAgo && <span className="text-xs" style={{ color: '#2A4A30' }}>{timeAgo}</span>}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          {listing.priceLabel && (
            <>
              <p className="font-black text-base" style={{ color: '#DCF5E2' }}>{listing.priceLabel.split('/')[0]}</p>
              {listing.unit && <p className="text-[10px]" style={{ color: 'var(--muted)' }}>per {listing.unit}</p>}
            </>
          )}
          <button
            className="mt-2 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors"
            style={{ background: 'rgba(0,232,122,0.08)', color: '#00E87A', border: '1px solid rgba(0,232,122,0.15)' }}
          >
            Inquire
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CreateListingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', category: 'Grains', priceLabel: '', unit: 'kg', country: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.title || !form.priceLabel) { setError('Title and price are required'); return; }
    setLoading(true);
    const res = await createListing({ ...form, sellerSub: user!.sub, sellerName: user?.name ?? user?.email });
    setLoading(false);
    if (res.success) { onCreated(); onClose(); }
    else setError(res.error ?? 'Failed to create listing');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: 'rgba(2,10,4,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 200 }}
        className="glass-strong rounded-3xl p-7 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-black mb-6" style={{ color: '#DCF5E2' }}>New Listing</h2>
        <div className="space-y-4">
          <input className="input-green" placeholder="Product title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="input-green resize-none" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-green" placeholder="Price (e.g. 1200 UGX)" value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} />
            <input className="input-green" placeholder="Unit (kg, tonne…)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className="input-green" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="input-green" placeholder="Country (UG, KE…)" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          {error && <p className="text-xs" style={{ color: '#FF8080' }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Post Listing
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MarketPage() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings]   = useState<MarketListing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [marketTab, setMarketTab] = useState<MarketTab>('local');
  const [userCountry, setUserCountry] = useState('');

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => setUserCountry(d.country_code ?? ''))
      .catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    const data = await listActiveListings(category === 'All' ? undefined : category);
    setListings(data);
    setLoading(false);
  };

  useEffect(() => { if (!authLoading) load(); }, [category, authLoading]);

  const local = listings.filter(l => !l.isInternational || (userCountry && l.country === userCountry));
  const international = listings.filter(l => l.isInternational || (userCountry && l.country !== userCountry));
  const activeList = marketTab === 'local' ? local : international;
  const filtered = activeList.filter(l => !l.isInternational || user);

  return (
    <div className="min-h-screen px-6 md:px-14 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                <Handshake size={18} style={{ color: '#00DDB8' }} />
              </div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: '#DCF5E2' }}>P2P Market</h1>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {listings.length} active listing{listings.length !== 1 && 's'}
              {!user && ' · Sign in to create listings'}
            </p>
          </div>
          {user ? (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              <Plus size={14} /> List produce
            </motion.button>
          ) : (
            <Link href="/account/login">
              <button className="btn-ghost text-sm px-4 py-2.5 flex items-center gap-2">
                <Lock size={13} /> Sign in
              </button>
            </Link>
          )}
        </motion.div>

        {/* Local / International tabs */}
        <div className="flex gap-2 mb-5">
          {([['local', Home, 'Local Market'], ['international', Globe, 'International']] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setMarketTab(id as MarketTab)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={marketTab === id
                ? { background: 'rgba(0,232,122,0.12)', border: '1px solid rgba(0,232,122,0.25)', color: '#00E87A' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#3D6645' }}
            >
              <Icon size={13} />
              {label}
              {id === 'international' && !user && <Lock size={10} style={{ color: '#FFB800' }} />}
            </button>
          ))}
          {userCountry && (
            <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: '#2A4A30' }}>
              <MapPin size={10} />{userCountry}
            </span>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((c) => (
            <motion.button
              key={c}
              whileTap={{ scale: 0.94 }}
              onClick={() => setCategory(c)}
              className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={
                category === c
                  ? { background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.3)', color: '#00E87A' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#3D6645' }
              }
            >
              {c}
            </motion.button>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : filtered.length === 0 && marketTab === 'international' && !user ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <LockedListingCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Package size={36} className="mx-auto mb-4 opacity-20" style={{ color: '#00E87A' }} />
            <p className="font-semibold" style={{ color: '#3D6645' }}>No {marketTab} listings yet</p>
            {!user && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Sign in to see international listings and post your own</p>}
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((l) =>
                !user && l.isInternational
                  ? <LockedListingCard key={l.id} />
                  : <ListingCard key={l.id} listing={l} />
              )}
            </div>
          </AnimatePresence>
        )}

        {/* Price trends */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 glass rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} style={{ color: '#00E87A' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3D6645' }}>Market signals</span>
          </div>
          <p className="text-xs" style={{ color: '#2A4A30' }}>
            Price trends update from active listings. Sign in to access regional market intelligence and price alerts.
          </p>
          {!user && (
            <Link href="/account/login">
              <button className="mt-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#00E87A' }}>
                Unlock full data <ChevronRight size={12} />
              </button>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Create listing modal */}
      <AnimatePresence>
        {showCreate && user && (
          <CreateListingModal onClose={() => setShowCreate(false)} onCreated={load} />
        )}
      </AnimatePresence>
    </div>
  );
}
