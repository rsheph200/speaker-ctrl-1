'use client';

import type { ReactNode } from 'react';

import { AppSettingsProvider } from '@/context/AppSettingsContext';

export function Providers({ children }: { children: ReactNode }) {
  return <AppSettingsProvider>{children}</AppSettingsProvider>;
}
