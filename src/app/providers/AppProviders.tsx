import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 30, // 30 segundos
          },
        },
      })
  );

  useEffect(() => useAuthStore.subscribe((state, previous) => {
    if (state.user?.id !== previous.user?.id || (state.status === 'anonimo' && previous.status !== 'anonimo')) {
      queryClient.clear();
    }
  }), [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

export default AppProviders;
