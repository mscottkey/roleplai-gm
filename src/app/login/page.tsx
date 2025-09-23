
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from '@/components/login-form';
import { BrandedLoadingSpinner } from '@/components/icons';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when loading is false and user is present.
    if (!loading && user) {
      router.push('/play');
    }
  }, [user, loading, router]);

  // Show a loading screen while auth state is resolving or if we have a user and are about to redirect.
  if (loading || (!loading && user)) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
        <BrandedLoadingSpinner className="h-24 w-24" />
        <p className="text-muted-foreground text-sm animate-pulse">
          Loading Session...
        </p>
      </div>
    );
  }

  // Only show the login form if loading is done and there's no user.
  return <LoginForm />;
}
