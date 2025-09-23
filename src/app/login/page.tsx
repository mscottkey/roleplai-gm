
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
    if (!loading && !redirectLoading && user) {
      router.push('/play');
    }
  }, [user, loading, redirectLoading, router]);

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

  return <LoginForm />;
}
