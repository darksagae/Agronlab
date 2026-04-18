'use client';

import { useEffect } from 'react';
import { configureAmplify } from '../lib/amplify';

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureAmplify();
  }, []);

  // Also configure on server-side import (safe to call multiple times)
  configureAmplify();

  return <>{children}</>;
}
