'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { useQuery } from '@tanstack/react-query';
import { clearPrivateKey } from '../lib/crypto';
import { getMyProfile } from '../lib/queries';

const ADMIN_EMAIL = 'admin@agron.uk';

/* ── SVG icon set ──────────────────────────────────────── */
type IconName = 'home' | 'market' | 'browse' | 'coffee' | 'messages' | 'catalog' | 'inventory' | 'store' | 'admin';

function NavIcon({ name, className = 'w-4 h-4' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, string> = {
    home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    market: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
    browse: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z',
    coffee: 'M9.75 3.75H14.25M12 3.75V8.25M6.75 8.25h10.5a.75.75 0 01.75.75v6.75a4.5 4.5 0 01-4.5 4.5h-6a4.5 4.5 0 01-4.5-4.5V9a.75.75 0 01.75-.75zm10.5 0h1.5a2.25 2.25 0 010 4.5h-1.5',
    messages: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z',
    catalog: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
    inventory: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    store: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z',
    admin: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[name]} />
    </svg>
  );
}

/* ── Nav configs ───────────────────────────────────────── */
type NavItem = { href: string; label: string; icon: IconName };

const SELLER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/dashboard/store', label: 'My Market', icon: 'market' },
  { href: '/dashboard/market', label: 'Browse', icon: 'browse' },
  { href: '/dashboard/coffee', label: 'Coffee', icon: 'coffee' },
  { href: '/dashboard/messages', label: 'Messages', icon: 'messages' },
];

const SHOP_OWNER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/dashboard/my-store', label: 'My Store', icon: 'store' },
  { href: '/dashboard/catalog', label: 'Catalog', icon: 'catalog' },
  { href: '/dashboard/inventory', label: 'Inventory', icon: 'inventory' },
  { href: '/dashboard/market', label: 'Market', icon: 'browse' },
  { href: '/dashboard/coffee', label: 'Coffee', icon: 'coffee' },
  { href: '/dashboard/messages', label: 'Messages', icon: 'messages' },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/dashboard/store', label: 'My Market', icon: 'market' },
  { href: '/dashboard/catalog', label: 'Catalog', icon: 'catalog' },
  { href: '/dashboard/inventory', label: 'Inventory', icon: 'inventory' },
  { href: '/dashboard/my-store', label: 'My Store', icon: 'store' },
  { href: '/dashboard/market', label: 'Browse', icon: 'browse' },
  { href: '/dashboard/coffee', label: 'Coffee', icon: 'coffee' },
  { href: '/dashboard/messages', label: 'Messages', icon: 'messages' },
  { href: '/dashboard/admin/sellers', label: 'Admin', icon: 'admin' },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/dashboard/admin/system', label: 'System', icon: 'admin' },
  { href: '/dashboard/admin/sellers', label: 'Sellers', icon: 'market' },
  { href: '/dashboard/admin/training-data', label: 'Training Data', icon: 'catalog' },
  { href: '/dashboard/market', label: 'Market', icon: 'browse' },
  { href: '/dashboard/messages', label: 'Messages', icon: 'messages' },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: profile } = useQuery({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userAttrs } = useQuery({
    queryKey: ['userAttributes'],
    queryFn: fetchUserAttributes,
    staleTime: 10 * 60 * 1000,
  });

  const isSuperAdmin = userAttrs?.email === ADMIN_EMAIL;

  const handleSignOut = async () => {
    clearPrivateKey();
    await signOut();
    router.push('/');
  };

  let nav = ADMIN_NAV;
  if (isSuperAdmin) nav = SUPER_ADMIN_NAV;
  else if (profile?.role === 'SELLER') nav = SELLER_NAV;
  else if (profile?.role === 'BOTH') nav = SHOP_OWNER_NAV;

  const roleLabel = isSuperAdmin
    ? 'Super Admin'
    : profile?.role === 'SELLER'
    ? 'Seller'
    : profile?.role === 'BOTH'
    ? 'Shop Owner'
    : null;

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="bg-agron-dark text-white px-4 py-3 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base shrink-0">
            <Image src="/logo.png" alt="AGRON" width={28} height={28} className="rounded-lg" />
            <span>AGRON</span>
            {roleLabel && (
              <span className="hidden sm:inline text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal text-green-200">
                {roleLabel}
              </span>
            )}
          </Link>
          <div className="hidden sm:flex gap-0.5">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all duration-150 border-b-[3px] ${
                  isActive(n.href)
                    ? 'text-agron-green bg-agron-green/15 font-semibold border-agron-green rounded-t-lg'
                    : 'text-green-100/80 hover:text-white hover:bg-white/10 border-transparent rounded-lg'
                }`}
              >
                <NavIcon name={n.icon} />
                {n.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="hidden md:flex items-center gap-1.5 text-xs text-green-300 hover:text-white truncate max-w-[120px] transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            {profile?.displayName ?? 'Profile'}
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-green-200 hover:text-white transition-colors border border-white/20 px-3 py-1 rounded-lg hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex sm:hidden gap-1 mt-2 overflow-x-auto pb-1">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
              isActive(n.href)
                ? 'text-agron-green bg-agron-green/20 font-semibold'
                : 'text-green-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <NavIcon name={n.icon} className="w-3.5 h-3.5" />
            {n.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
