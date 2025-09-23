
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { LoginForm } from '@/components/login-form'
import { BrandedLoadingSpinner } from '@/components/icons'

export default function LoginPage() {
  const { user, loading, redirectLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !redirectLoading && user) {
      router.replace('/play')
    }
  }, [loading, redirectLoading, user, router])

  // Only show spinner while we truly don’t know the state yet,
  // or while we’re completing the Google redirect handshake.
  if (loading || redirectLoading) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
        <BrandedLoadingSpinner className="h-24 w-24" />
        <p className="text-muted-foreground text-sm animate-pulse">
          {redirectLoading ? 'Finalizing Google sign-in…' : 'Loading session…'}
        </p>
      </div>
    )
  }

  // This prevents the login form from flashing while the redirect is happening.
  if (user) return null;

  return <LoginForm />
}
