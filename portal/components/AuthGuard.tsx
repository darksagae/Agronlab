'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import {
  generateKeypair,
  storePrivateKey,
  loadPrivateKey,
} from '../lib/crypto';
import { getMyProfile, upsertProfile } from '../lib/queries';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await getCurrentUser();

        // Ensure user has an encryption keypair
        const privateKey = loadPrivateKey();
        if (!privateKey) {
          const { publicKey, privateKey: sk } = generateKeypair();
          storePrivateKey(sk);
          const profile = await getMyProfile();
          if (!profile?.publicKey) {
            await upsertProfile({ publicKey });
          }
        }

        // Pick up pending role/country from signup flow
        const pendingRole = localStorage.getItem('pendingRole') as 'SELLER' | 'SHOP_OWNER' | null;
        const pendingCountry = localStorage.getItem('pendingCountry');
        const pendingBusinessName = localStorage.getItem('pendingBusinessName');

        if (pendingRole) {
          // Map SHOP_OWNER → BOTH (has both store and market access); SELLER → SELLER
          const amplifyRole = pendingRole === 'SHOP_OWNER' ? 'BOTH' : 'SELLER';
          await upsertProfile({
            role: amplifyRole,
            ...(pendingCountry ? { country: pendingCountry } : {}),
            ...(pendingBusinessName ? { businessName: pendingBusinessName } : {}),
          });
          localStorage.removeItem('pendingRole');
          localStorage.removeItem('pendingCountry');
          localStorage.removeItem('pendingBusinessName');
        }

        setReady(true);
      } catch {
        router.replace('/login');
      }
    };
    check();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-agron-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-agron-green rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div className="text-agron-green text-sm font-medium animate-pulse">Loading AGRON Portal…</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
