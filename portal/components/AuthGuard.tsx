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
        const user = await getCurrentUser();

        // Ensure merchant has an encryption keypair
        const privateKey = loadPrivateKey();
        if (!privateKey) {
          const { publicKey, privateKey: sk } = generateKeypair();
          storePrivateKey(sk);
          // Push public key to MerchantProfile
          const profile = await getMyProfile();
          if (!profile?.publicKey) {
            await upsertProfile({ publicKey });
          }
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
        <div className="text-agron-green text-lg font-medium animate-pulse">Loading AGRON Portal…</div>
      </div>
    );
  }

  return <>{children}</>;
}
