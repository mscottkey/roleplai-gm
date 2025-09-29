
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import '../globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseProvider } from '@/components/firebase-provider';
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard';

export const metadata: Metadata = {
  title: 'RoleplAI GM - Admin',
  description: 'Admin dashboard for your AI-powered Game Master.',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <AdminAuthGuard>
          {children}
      </AdminAuthGuard>
  );
}

  