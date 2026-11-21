import '@/styles/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { useState } from 'react';

import { ToastProvider } from '@/components/Toast';

export default function RootLayout() {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: true } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <div className="app">
          <Slot />
        </div>
      </ToastProvider>
    </QueryClientProvider>
  );
}
