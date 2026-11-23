'use client';

import { store } from '@/redux/store/store';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <Toaster richColors position="top-right" />
      {children}
    </Provider>
  );
}