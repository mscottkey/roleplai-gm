import type { Metadata } from 'next'
import { AuthGuard } from '@/components/auth-guard'

export const metadata: Metadata = {
  title: 'RoleplAI GM - Play',
  description: 'Your AI-powered Game Master for tabletop RPGs.',
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  // AuthProvider is in the root layout.
  // We only need the AuthGuard here to protect the /play route.
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
}
