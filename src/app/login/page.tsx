
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from '@/components/login-form';
import { BrandedLoadingSpinner } from '@/components/icons';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // The AuthGuard in the /play layout now handles redirecting logged-in users.
  // We only need to handle the case where a user lands here *after* logging in.
  useEffect(() => {
    if (!loading && user) {
      router.replace('/play');
    }
  }, [user, loading, router]);


  // Show loading spinner while auth is resolving or if we are about to redirect.
  if (loading || user) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
        <BrandedLoadingSpinner className="h-24 w-24" />
        <p className="text-muted-foreground text-sm animate-pulse">
          Authenticating...
        </p>
      </div>
    );
  }

  // Only show the login form if we are done loading and there is no user.
  return <LoginForm />;
}
