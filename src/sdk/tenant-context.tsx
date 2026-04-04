'use client';

import { createContext, useContext } from 'react';
import type { TenantContext } from './types';

const Ctx = createContext<TenantContext | null>(null);

export function TenantProvider({
  value,
  children,
}: {
  value: TenantContext;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTenant(): TenantContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTenant must be used inside a TenantProvider');
  return ctx;
}
