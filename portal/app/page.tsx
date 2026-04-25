'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ── Inline SVG icons ────────────────────────────────── */
const ListingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const StoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
  </svg>
);

const LockChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

/* ── Feature mocks ───────────────────────────────────── */
function ListingsMock() {
  return (
    <div className="glass-card-light rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-agron-green/10 flex items-center justify-between" style={{ background: 'rgba(76,175,80,0.06)' }}>
        <span className="text-xs font-semibold text-agron-dark">My Market Listings</span>
        <span className="text-xs text-agron-green font-semibold">3 active</span>
      </div>
      {[
        { name: 'Maize · 500 kg', inquiries: '5 inquiries' },
        { name: 'Sorghum · 200 kg', inquiries: '3 inquiries' },
        { name: 'Groundnuts · 80 kg', inquiries: '1 inquiry' },
      ].map((item, i) => (
        <div key={i} className={`flex items-center justify-between px-5 py-3.5 ${i < 2 ? 'border-b border-agron-green/08' : ''}`} style={{ borderColor: 'rgba(76,175,80,0.06)' }}>
          <div>
            <div className="text-sm font-medium text-gray-800">{item.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.inquiries}</div>
          </div>
          <span className="text-xs bg-green-100/80 text-green-700 px-2.5 py-1 rounded-full font-semibold">Live</span>
        </div>
      ))}
    </div>
  );
}

function StoreMock() {
  const colors = ['bg-green-100/70', 'bg-amber-100/70', 'bg-blue-100/70', 'bg-purple-100/70', 'bg-red-100/70', 'bg-agron-light/70'];
  return (
    <div className="glass-card-light rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-agron-green/10" style={{ background: 'rgba(76,175,80,0.06)' }}>
        <span className="text-xs font-semibold text-agron-dark">Store Catalog · 24 products</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {colors.map((c, i) => (
            <div key={i} className={`aspect-square rounded-xl ${c}`} style={{ backdropFilter: 'blur(4px)' }} />
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Stock level</span>
            <span className="text-agron-green font-semibold">68%</span>
          </div>
          <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-agron-green rounded-full" style={{ width: '68%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMock() {
  return (
    <div className="glass-card-light rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-agron-green/10 flex items-center gap-2.5" style={{ background: 'rgba(76,175,80,0.06)' }}>
        <div className="w-7 h-7 bg-agron-green/90 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">O</div>
        <div>
          <div className="text-xs font-semibold text-agron-dark">Ochen David</div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <svg className="w-2.5 h-2.5 text-agron-green" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            End-to-end encrypted
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl rounded-tl-sm px-3 py-2 text-xs max-w-[80%]" style={{ background: 'rgba(0,0,0,0.05)', color: '#374151' }}>
          Is the 500kg maize still available?
        </div>
        <div className="bg-agron-green/90 text-white rounded-xl rounded-tr-sm px-3 py-2 text-xs max-w-[80%] ml-auto">
          Yes, I can deliver next week.
        </div>
        <div className="rounded-xl rounded-tl-sm px-3 py-2 text-xs max-w-[80%]" style={{ background: 'rgba(0,0,0,0.05)', color: '#374151' }}>
          Great! What&apos;s your best price per kg?
        </div>
      </div>
    </div>
  );
}

/* ── Count-up hook ───────────────────────────────────── */
function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  const start = () => {
    if (started.current) return;
    started.current = true;
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  return { value, start };
}

/* ── Feature data ────────────────────────────────────── */
const FEATURES = [
  {
    icon: <ListingsIcon />,
    tag: 'Reach buyers across Africa',
    title: 'Market Listings',
    desc: 'Post products and reach local and international buyers. Set your price, describe your stock, and start receiving inquiries within minutes — no middlemen.',
    mock: <ListingsMock />,
  },
  {
    icon: <StoreIcon />,
    tag: 'Real-time inventory control',
    title: 'Store Management',
    desc: 'Manage your registered store catalog and inventory in one professional hub. Track stock levels, update prices, and keep your storefront current and accurate.',
    mock: <StoreMock />,
  },
  {
    icon: <LockChatIcon />,
    tag: 'End-to-end encrypted',
    title: 'Private Buyer Chat',
    desc: 'Every conversation between you and your buyers is end-to-end encrypted. Only you and your buyer can read your messages — not even AGRON can see them.',
    mock: <ChatMock />,
  },
];

/* ── Page ────────────────────────────────────────────── */
export default function HomePage() {
  const [navSolid, setNavSolid] = useState(false);
  const statsRef = useRef<HTMLElement>(null);

  const s1 = useCountUp(12000);
  const s2 = useCountUp(500);
  const s3 = useCountUp(50);
  const s4 = useCountUp(100);

  /* Nav scroll solidify */
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Scroll reveal observer */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Stats count-up observer */
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          s1.start(); s2.start(); s3.start(); s4.start();
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white">
      {/* ── Floating nav ─────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        navSolid ? 'bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="AGRON" className="w-8 h-8 rounded-xl shadow-sm" />
            <span className={`font-bold text-sm tracking-tight transition-colors ${navSolid ? 'text-agron-dark' : 'text-white'}`}>
              AGRON Portal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                navSolid ? 'text-gray-600 hover:text-agron-dark hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-agron-green text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-600 transition-all hover:-translate-y-px shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative min-h-screen bg-agron-dark flex items-center overflow-hidden pt-16">
        {/* Background radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 60% at 70% 50%, rgba(76,175,80,0.12) 0%, transparent 70%)',
        }} />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%234CAF50'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }} />

        <div className="relative max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-agron-green/20 border border-agron-green/30 text-green-300 text-xs font-medium px-3 py-1.5 rounded-full mb-8 hero-badge">
              <span className="w-1.5 h-1.5 bg-agron-green rounded-full animate-pulse" />
              Trusted by agricultural traders across Africa
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.15] mb-6">
              <span className="hero-word block" style={{ animationDelay: '0.1s' }}>Post Listings.</span>
              <span className="hero-word block" style={{ animationDelay: '0.25s' }}>Chat Buyers.</span>
              <span className="hero-word block text-agron-green" style={{ animationDelay: '0.4s' }}>Grow.</span>
            </h1>

            <p className="text-green-100/60 text-lg leading-relaxed mb-10 hero-sub" style={{ animationDelay: '0.5s' }}>
              The professional hub for farmers, traders, and shop owners. Post listings, manage your store, chat with buyers — encrypted, real-time, from anywhere.
            </p>

            <div className="flex flex-wrap items-center gap-4 hero-ctas" style={{ animationDelay: '0.6s' }}>
              <Link
                href="/signup"
                className="bg-agron-green text-white px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-green-500 transition-all hover:-translate-y-0.5 shadow-lg shadow-green-900/30"
              >
                Create Free Account →
              </Link>
              <Link
                href="/login"
                className="text-green-200 border border-white/20 px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Floating UI preview */}
          <div className="hidden lg:flex flex-col gap-4 hero-preview" style={{ animationDelay: '0.35s' }}>
            <div className="glass-card rounded-2xl p-5">
              <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-3">Active Listings</p>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-white text-4xl font-bold">24</span>
                <span className="text-green-400 text-sm mb-1">+3 this week</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-agron-green rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl p-4">
                <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-2">Inquiries</p>
                <p className="text-white text-3xl font-bold">47</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(76,175,80,0.25)', border: '1px solid rgba(76,175,80,0.4)', backdropFilter: 'blur(20px)' }}>
                <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-2">Revenue</p>
                <p className="text-white text-2xl font-bold">UGX 4.2M</p>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-agron-green/30 rounded-full flex items-center justify-center shrink-0 text-agron-green">
                <LockChatIcon />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium">Encrypted message</p>
                <p className="text-green-300/70 text-xs truncate">&ldquo;Is the maize still available?&rdquo;</p>
              </div>
              <span className="ml-auto text-xs text-agron-green shrink-0">2m ago</span>
            </div>
          </div>
        </div>

      </section>

      {/* ── Stats band ───────────────────────────────── */}
      <section ref={statsRef} className="bg-agron-dark py-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: s1.value, suffix: '+', label: 'Farmers on Platform' },
            { value: s2.value, suffix: '+', label: 'Active Listings' },
            { value: s3.value, suffix: '+', label: 'Languages Supported' },
            { value: s4.value, suffix: '%', label: 'Message Encryption' },
          ].map((s, i) => (
            <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="text-4xl font-bold text-agron-green">{s.value.toLocaleString()}{s.suffix}</div>
              <div className="text-green-300/60 text-sm mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Diagonal divider: dark → white */}
      <div className="bg-agron-dark overflow-hidden">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-14 block">
          <polygon points="1200,0 0,60 1200,60" fill="white" />
        </svg>
      </div>

      {/* ── Features — alternating ───────────────────── */}
      <section className="py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6 space-y-28">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              {/* Text: left on even, right (order-2) on odd */}
              <div className={`${i % 2 === 1 ? 'lg:order-2 reveal-right' : 'reveal-left'}`}>
                <div className="w-12 h-12 bg-agron-light rounded-2xl flex items-center justify-center mb-5 text-agron-green">
                  {f.icon}
                </div>
                <div className="text-xs font-bold text-agron-green uppercase tracking-widest mb-2">{f.tag}</div>
                <h2 className="text-3xl font-bold text-agron-dark mb-4">{f.title}</h2>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>

              {/* Visual: right on even, left (order-1) on odd */}
              <div className={`${i % 2 === 1 ? 'lg:order-1 reveal-left' : 'reveal-right'}`}>
                {f.mock}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Partners ─────────────────────────────────── */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-10">Partners &amp; Ecosystem</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {[
              { name: 'Pesapal', label: 'Payments', color: '#E63946' },
              { name: 'AWS', label: 'Cloud', color: '#FF9900' },
              { name: 'Vercel', label: 'Infrastructure', color: '#000000' },
              { name: 'USAID', label: 'Development', color: '#002868' },
              { name: 'CABI', label: 'Agriculture', color: '#2C7A2C' },
              { name: 'GSMA', label: 'Mobile', color: '#00A0DF' },
            ].map((p) => (
              <div
                key={p.name}
                className="glass-card-light rounded-2xl p-5 flex flex-col items-center gap-2 reveal"
                style={{ transition: 'box-shadow 0.2s' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs"
                  style={{ background: p.color }}
                >
                  {p.name.slice(0, 2)}
                </div>
                <span className="text-xs font-bold text-gray-700">{p.name}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diagonal divider: white → dark */}
      <div className="bg-white overflow-hidden">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-14 block">
          <polygon points="0,0 1200,60 0,60" fill="#2c5530" />
        </svg>
      </div>

      {/* ── Dark CTA ─────────────────────────────────── */}
      <section className="bg-agron-dark py-28">
        <div className="max-w-2xl mx-auto text-center px-6 reveal">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to sell smarter?</h2>
          <p className="text-green-200/60 text-lg leading-relaxed mb-10">
            Join thousands of agricultural traders already using AGRON to reach more buyers, manage their business, and grow.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-agron-green text-white px-8 py-4 rounded-xl font-semibold text-sm hover:bg-green-500 transition-all hover:-translate-y-0.5 shadow-lg shadow-green-900/40"
            >
              Create Your Free Account →
            </Link>
            <Link
              href="/login"
              className="text-green-200 border border-white/20 px-8 py-4 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        <p>
          AGRON Portal · For sellers &amp; shop owners ·{' '}
          <a href="https://agron.uk" className="text-agron-green hover:underline" target="_blank" rel="noreferrer">agron.uk</a>
          {' '}·{' '}
          <a href="https://coffee.agron.uk" className="text-amber-600 hover:underline" target="_blank" rel="noreferrer">coffee.agron.uk</a>
        </p>
        <p className="mt-1">
          Are you a buyer?{' '}
          <a href="https://agron.uk" className="text-agron-green hover:underline" target="_blank" rel="noreferrer">
            Download the AGRON app
          </a>
        </p>
      </footer>
    </div>
  );
}
