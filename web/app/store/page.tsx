'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Package, ShoppingCart, Loader2, Store, ChevronLeft, Sparkles } from 'lucide-react';
import { getStoreProducts, getStoreCategories, fetchRegisteredStores, type StoreProduct, type StoreCategory, type RegisteredStore } from '@/lib/api';
import { PORTAL_URL } from '@/lib/amplify';

function ProductCard({ product, index }: { product: StoreProduct; index: number }) {
  const imageUrl = product.imageUrl
    ? product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `${PORTAL_URL}${product.imageUrl}`
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: '0 24px 60px rgba(0,232,122,0.12)' }}
      className="relative cursor-pointer group flex flex-col rounded-3xl overflow-visible pt-8"
      style={{
        background: 'rgba(10,28,14,0.45)',
        border: '1px solid rgba(0,232,122,0.08)',
        backdropFilter: 'blur(40px) saturate(160%)',
        WebkitBackdropFilter: 'blur(40px) saturate(160%)',
      }}
    >
      {/* Floating image */}
      <div className="relative flex items-end justify-center px-6 h-40 mb-4 overflow-visible">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            className="h-44 w-auto object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2 relative z-10"
            style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}
          />
        ) : (
          <div
            className="w-28 h-28 rounded-2xl flex items-center justify-center relative z-10"
            style={{ background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.1)' }}
          >
            <Package size={36} style={{ color: 'rgba(0,232,122,0.3)' }} />
          </div>
        )}
        {/* Glow behind image */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-6 blur-xl opacity-30 pointer-events-none"
          style={{ background: '#00E87A', borderRadius: '50%' }}
        />
      </div>

      {/* Info */}
      <div
        className="px-5 pb-5 flex flex-col flex-1 rounded-b-3xl"
        style={{ borderTop: '1px solid rgba(0,232,122,0.05)' }}
      >
        <h3 className="text-sm font-bold leading-snug mt-4 mb-1" style={{ color: '#DCF5E2' }}>
          {product.name}
        </h3>
        {product.description ? (
          <p className="text-[11px] leading-relaxed mb-3 line-clamp-2" style={{ color: '#3D6645' }}>
            {product.description}
          </p>
        ) : (
          <p className="text-[11px] mb-3" style={{ color: '#2A4A30' }}>{product.category}</p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="font-black text-base" style={{ color: '#DCF5E2' }}>
              {typeof product.price === 'number'
                ? `UGX ${product.price.toLocaleString()}`
                : product.price}
            </p>
            {product.unit && (
              <p className="text-[10px]" style={{ color: '#3D6645' }}>per {product.unit}</p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.18)' }}
          >
            <ShoppingCart size={15} style={{ color: '#00E87A' }} />
          </motion.button>
        </div>

        {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
          <p className="text-[10px] mt-2 font-semibold" style={{ color: '#FFB800' }}>Only {product.stock} left</p>
        )}
        {product.stock === 0 && (
          <p className="text-[10px] mt-2 font-semibold" style={{ color: '#FF8080' }}>Out of stock</p>
        )}
      </div>
    </motion.div>
  );
}

function ProductSkeleton() {
  return (
    <div
      className="rounded-3xl overflow-hidden pt-8"
      style={{
        background: 'rgba(10,28,14,0.35)',
        border: '1px solid rgba(0,232,122,0.06)',
        backdropFilter: 'blur(40px)',
      }}
    >
      <div className="flex justify-center px-6 h-40 items-end mb-4">
        <div className="skeleton w-24 h-32 rounded-xl" />
      </div>
      <div className="px-5 pb-5 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex justify-between items-center mt-4">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton w-10 h-10 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function StoreDirectory({ onSelect }: { onSelect: (store: RegisteredStore | null) => void }) {
  const [stores, setStores] = useState<RegisteredStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegisteredStores().then(s => { setStores(s); setLoading(false); });
  }, []);

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const COLORS = ['#00E87A', '#00DDB8', '#FFB800', '#E91E63', '#7986CB', '#CE93D8'];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
            <ShoppingBag size={18} style={{ color: '#00E87A' }} />
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: '#DCF5E2' }}>Store</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Agricultural inputs, seeds, and treatments from trusted suppliers.</p>
      </motion.div>

      {/* Agron Store — always first */}
      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,232,122,0.2)' }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect(null)}
        className="w-full glass-strong rounded-3xl p-6 mb-5 text-left relative overflow-hidden"
        style={{ border: '1px solid rgba(0,232,122,0.25)' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #00E87A, transparent 70%)' }} />
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ boxShadow: ['0 0 20px rgba(0,232,122,0.2)', '0 0 40px rgba(0,232,122,0.5)', '0 0 20px rgba(0,232,122,0.2)'] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.3)' }}
          >
            <Sparkles size={22} style={{ color: '#00E87A' }} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-black text-lg" style={{ color: '#DCF5E2' }}>Agron Store</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(0,232,122,0.12)', color: '#00E87A', border: '1px solid rgba(0,232,122,0.2)' }}>Official</span>
            </div>
            <p className="text-xs" style={{ color: '#3D6645' }}>AI crop supply partner · Seeds · Fertilizers · Treatments</p>
          </div>
          <ChevronLeft size={18} className="ml-auto rotate-180" style={{ color: '#3D6645' }} />
        </div>
      </motion.button>

      {/* Merchant stores */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : stores.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center">
          <Store size={28} className="mx-auto mb-3 opacity-20" style={{ color: '#00E87A' }} />
          <p className="text-sm" style={{ color: '#3D6645' }}>No merchant stores yet</p>
          <a href="https://portal.agron.uk/dashboard/store/new" target="_blank" rel="noopener noreferrer"
            className="text-xs mt-2 inline-block font-semibold" style={{ color: '#00E87A' }}>
            Register your store →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {stores.map((store, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <motion.button
                key={store.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
                onClick={() => onSelect(store)}
                className="glass rounded-2xl p-5 text-left"
                style={{ border: '1px solid rgba(0,232,122,0.06)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 font-black text-sm"
                  style={{ background: `${color}14`, border: `1px solid ${color}30`, color }}>
                  {store.logoUrl
                    ? <img src={store.logoUrl} alt={store.storeName} className="w-full h-full rounded-xl object-cover" />
                    : initials(store.storeName)}
                </div>
                <p className="font-bold text-sm leading-snug mb-0.5" style={{ color: '#DCF5E2' }}>{store.storeName}</p>
                {store.tagline && <p className="text-[11px] line-clamp-2" style={{ color: '#3D6645' }}>{store.tagline}</p>}
                {store.country && <p className="text-[10px] mt-1" style={{ color: '#2A4A30' }}>{store.country}</p>}
              </motion.button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-center mt-8" style={{ color: '#2A4A30' }}>
        Want your store here?{' '}
        <a href="https://portal.agron.uk/dashboard/store/new" target="_blank" rel="noopener noreferrer"
          className="font-semibold" style={{ color: '#00E87A' }}>Register at portal.agron.uk</a>
      </p>
    </div>
  );
}

export default function StorePage() {
  const [products, setProducts]     = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [category, setCategory]     = useState('');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [selectedStore, setSelectedStore] = useState<RegisteredStore | null | undefined>(undefined);

  useEffect(() => {
    if (selectedStore !== undefined) getStoreCategories().then(setCategories);
  }, [selectedStore]);

  useEffect(() => {
    if (selectedStore === undefined) return;
    setLoading(true);
    const t = setTimeout(async () => {
      const data = await getStoreProducts({ category: category || undefined, search: search || undefined });
      setProducts(data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [category, search, selectedStore]);

  const handleSearch = (val: string) => {
    setSearchInput(val);
    setSearch(val);
  };

  if (selectedStore === undefined) {
    return (
      <div className="min-h-screen px-6 md:px-14 py-10">
        <div className="max-w-4xl mx-auto">
          <StoreDirectory onSelect={s => setSelectedStore(s ?? null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 md:px-14 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => setSelectedStore(undefined)} className="flex items-center gap-1.5 text-xs mb-4 font-semibold"
            style={{ color: '#3D6645' }}>
            <ChevronLeft size={14} /> All Stores
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
              {selectedStore ? (
                <Store size={18} style={{ color: '#00E87A' }} />
              ) : (
                <ShoppingBag size={18} style={{ color: '#00E87A' }} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: '#DCF5E2' }}>
                {selectedStore ? selectedStore.storeName : 'Agron Store'}
              </h1>
              {selectedStore?.tagline && <p className="text-xs" style={{ color: 'var(--muted)' }}>{selectedStore.tagline}</p>}
            </div>
          </div>
          {!selectedStore && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Agricultural inputs, seeds, and treatments — delivered to you.</p>
          )}
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="relative mb-5">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            className="input-green pl-10"
            placeholder="Search seeds, fertilizers, treatments…"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </motion.div>

        {/* Category filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setCategory('')}
            className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
            style={
              !category
                ? { background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.3)', color: '#00E87A' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#3D6645' }
            }
          >
            All
          </motion.button>
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => setCategory(cat.name)}
              className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1"
              style={
                category === cat.name
                  ? { background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.3)', color: '#00E87A' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#3D6645' }
              }
            >
              {cat.name}
              {cat.productCount !== undefined && (
                <span className="opacity-50">({cat.productCount})</span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Package size={36} className="mx-auto mb-4 opacity-20" style={{ color: '#00E87A' }} />
            <p className="font-semibold" style={{ color: '#3D6645' }}>
              {search ? `No results for "${search}"` : 'No products in this category'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <AnimatePresence>
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </AnimatePresence>
          </div>
        )}

        {/* Product count */}
        {!loading && products.length > 0 && (
          <p className="text-center text-xs mt-8" style={{ color: 'var(--muted)' }}>
            {products.length} product{products.length !== 1 && 's'} available
          </p>
        )}
      </div>
    </div>
  );
}
