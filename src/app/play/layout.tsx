import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import '../globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseProvider } from '@/components/firebase-provider';

export const metadata: Metadata = {
  title: 'RoleplAI GM - Play',
  description: 'Your AI-powered Game Master for tabletop RPGs.',
};

export default function PlayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <FirebaseProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </FirebaseProvider>
      <Toaster />
    </ThemeProvider>
  );
}
