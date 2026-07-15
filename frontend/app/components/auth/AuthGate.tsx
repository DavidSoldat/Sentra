'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { SignInScreen } from './SignIn';

export function AuthGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#080c10]'>
        <span className='font-mono text-sm text-[#768390] animate-pulse'>
          Loading…
        </span>
      </div>
    );
  }

  if (!user) return <SignInScreen />;

  return <>{children}</>;
}
