'use client';

import { QueryClient, QueryClientProvider as TanstackProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  );
  return <TanstackProvider client={queryClient}>{children}</TanstackProvider>;
}
