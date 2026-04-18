'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { clearPrivateKey } from '../lib/crypto';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dashboard/catalog', label: 'Catalog', icon: '📦' },
  { href: '/dashboard/inventory', label: 'Inventory', icon: '📊' },
  { href: '/dashboard/my-store', label: 'My Store', icon: '🏬' },
  { href: '/dashboard/store', label: 'Listings', icon: '🏪' },
  { href: '/dashboard/market', label: 'Market', icon: '🛒' },
  { href: '/dashboard/messages', label: 'Messages', icon: '💬' },
  { href: '/dashboard/admin/sellers', label: 'Admin', icon: '🔐' },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    clearPrivateKey();
    await signOut();
    router.push('/');
  };

  return (
    <nav className="bg-agron-dark text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-7 h-7 bg-agron-green rounded-full flex items-center justify-center text-sm">A</div>
            <span>AGRON Portal</span>
          </Link>
          <div className="hidden sm:flex gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
                    ? 'bg-agron-green text-white'
                    : 'text-green-100 hover:bg-white/10'
                }`}
              >
                {n.icon} {n.label}
              </Link>
            ))}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-green-200 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Mobile nav */}
      <div className="flex sm:hidden gap-1 mt-2 overflow-x-auto">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
                ? 'bg-agron-green text-white'
                : 'text-green-100 hover:bg-white/10'
            }`}
          >
            {n.icon} {n.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
