
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from '@/components/login-form';
import { BrandedLoadingSpinner } from '@/components/icons';

export default function LoginPage() {
  const { user, loading, redirectLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect until both general loading and redirect loading are false
    if (!loading && !redirectLoading && user) {
      router.push('/play');
    }
  }, [user, loading, redirectLoading, router]);

  // Show a loading screen if we're still processing auth state or a redirect
  if (loading || redirectLoading || user) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
        <BrandedLoadingSpinner className="h-24 w-24" />
        <p className="text-muted-foreground text-sm animate-pulse">
          {redirectLoading ? 'Finalizing Sign In...' : 'Loading Session...'}
        </p>
      </div>
    );
  }

  // Only show the login form if all loading is done and there's no user
  return <LoginForm />;
}
