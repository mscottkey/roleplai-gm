'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BrandedLoadingSpinner } from './icons';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, redirectLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for both loading states to be false before making a decision
    if (!loading && !redirectLoading && !user) {
      router.push('/login');
    }
  }, [user, loading, redirectLoading, router]);

  // Show a loading screen while we wait for the auth state to resolve
  if (loading || redirectLoading) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
        <BrandedLoadingSpinner className="h-24 w-24" />
        <p className="text-muted-foreground text-sm animate-pulse">
          {redirectLoading ? 'Finalizing sign-in…' : 'Loading session…'}
        </p>
      </div>
    );
  }

  // If there's a user, show the children
  if (user) {
    return <>{children}</>;
  }

  // If no user, the useEffect will redirect, so we can show a brief
  // loading state or null.
  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
      <BrandedLoadingSpinner className="h-24 w-24" />
      <p className="text-muted-foreground text-sm animate-pulse">
        Redirecting...
      </p>
    </div>
  );
}
