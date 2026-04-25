'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, ScanLine, Handshake, ShoppingBag, User, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { WebChatbot } from './WebChatbot';

const tabs = [
  { id: 'home',    icon: Sprout,      label: 'Home',    href: '/' },
  { id: 'care',    icon: ScanLine,    label: 'AI Care', href: '/care' },
  { id: 'plan',    icon: Sparkles,    label: 'AI Plan', href: '/plan' },
  { id: 'market',  icon: Handshake,   label: 'Market',  href: '/market' },
  { id: 'store',   icon: ShoppingBag, label: 'Store',   href: '/store' },
  { id: 'account', icon: User,        label: 'Account', href: '/account' },
];

function isActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function SideTab({ tab, active }: { tab: (typeof tabs)[0]; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link href={tab.href} className="relative block rounded-xl overflow-hidden">
      {active && (
        <motion.div
          layoutId="sidebar-pill"
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,232,122,0.12), rgba(0,232,122,0.04))',
            border: '1px solid rgba(0,232,122,0.22)',
          }}
          transition={{ type: 'spring', bounce: 0.12, duration: 0.5 }}
        />
      )}
      <div
        className={clsx(
          'relative z-10 flex items-center gap-3 px-4 py-3 transition-colors duration-150',
          active ? 'text-[#00E87A]' : 'text-[#3D6645] hover:text-[#7CB87E]',
        )}
      >
        <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
        <span
          className={clsx(
            'text-sm font-medium',
            active && 'text-glow',
          )}
        >
          {tab.label}
        </span>
      </div>
    </Link>
  );
}

function BottomTab({ tab, active }: { tab: (typeof tabs)[0]; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link href={tab.href} className="flex-1 relative flex flex-col items-center justify-center py-2">
      {active && (
        <motion.div
          layoutId="bottom-pill"
          className="absolute inset-x-2 inset-y-1 rounded-xl"
          style={{ background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.15)' }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
        />
      )}
      <motion.div
        whileTap={{ scale: 0.82 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        className={clsx(
          'relative z-10 flex flex-col items-center gap-0.5',
          active ? 'text-[#00E87A]' : 'text-[#3D6645]',
        )}
      >
        <Icon size={21} strokeWidth={active ? 2.4 : 1.8} />
        <span className="text-[9px] font-semibold tracking-wide">{tab.label}</span>
      </motion.div>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar flex flex-col">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-5 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <Image src="/logo.png" alt="AGRON" width={32} height={32} className="rounded-lg" />
          <span className="font-black text-lg tracking-tight" style={{ color: '#DCF5E2' }}>
            AGRON
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {tabs.map((tab) => (
            <SideTab key={tab.id} tab={tab} active={isActive(tab.href, pathname)} />
          ))}
        </nav>

        {/* External links */}
        <div className="px-4 pb-4 space-y-2">
          <a
            href="https://portal.agron.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ color: '#3D6645', border: '1px solid rgba(255,255,255,0.05)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7CB87E')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#3D6645')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Merchant Portal
          </a>
          <a
            href="https://coffee.agron.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ color: '#3D6645', border: '1px solid rgba(255,255,255,0.05)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7CB87E')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#3D6645')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Coffee Store
          </a>
        </div>

        {/* App badges */}
        <div className="px-4 pb-6">
          <div className="glass rounded-2xl p-3">
            <p className="text-[10px] text-center mb-2" style={{ color: 'var(--muted)' }}>Available on</p>
            <div className="flex gap-2">
              {['iOS', 'Android'].map((p) => (
                <button key={p} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors" style={{ background: 'rgba(255,255,255,0.05)', color: '#7CB87E' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom bar (mobile) */}
      <div className="bottombar">
        {tabs.map((tab) => (
          <BottomTab key={tab.id} tab={tab} active={isActive(tab.href, pathname)} />
        ))}
      </div>

      <WebChatbot />
    </div>
  );
}
