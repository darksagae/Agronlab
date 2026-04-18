import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/data/queryClient';
import { initLocalDatabase } from '../lib/sqlite/database';

export function QueryProvider({ children }) {
  useEffect(() => {
    initLocalDatabase().catch((e) => {
      console.warn('[QueryProvider] SQLite init', e?.message || e);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
