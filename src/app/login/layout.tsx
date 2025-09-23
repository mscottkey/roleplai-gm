import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RoleplAI GM - Login',
  description: 'Login to your AI-powered Game Master for tabletop RPGs.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // Providers are now in the root layout, so this can be a simple fragment.
  return <>{children}</>;
}
