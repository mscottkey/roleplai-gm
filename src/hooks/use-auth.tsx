
'use client';

import React, { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged, getRedirectResult, type User, getAdditionalUserInfo } from 'firebase/auth';
import { getAuthWithPersistence } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';
import * as gtag from '@/lib/gtag';

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  redirectLoading: boolean;
  redirectProcessed: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  redirectLoading: true,
  redirectProcessed: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redirectLoading, setRedirectLoading] = useState(true);
  const [redirectProcessed, setRedirectProcessed] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const auth = getAuthWithPersistence();
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        console.log('[auth] getRedirectResult =>', result);
        
        if (result && result.user) {
          const wasGoogleRedirect = sessionStorage.getItem('google_auth_redirect') === 'true';
          if (wasGoogleRedirect) {
            sessionStorage.removeItem('google_auth_redirect');
            
            const additionalInfo = getAdditionalUserInfo(result);
            if (additionalInfo?.isNewUser) {
                gtag.event({ action: 'sign_up', category: 'engagement', label: 'google' });
            } else {
                gtag.event({ action: 'login', category: 'engagement', label: 'google' });
            }

            toast({
              title: 'Signed In Successfully',
              description: `Welcome, ${result.user.displayName || result.user.email || 'friend'}!`,
            });
            
            // Navigate to /play with a flag
            router.push('/login?authReturn=true');
          }
        }
        setRedirectProcessed(true);
      } catch (error: any) {
        console.error('[auth] getRedirectResult error', error);
        sessionStorage.removeItem('google_auth_redirect');
        if (error.code && error.code !== 'auth/redirect-cancelled-by-user' && error.code !== 'auth/user-cancelled') {
          toast({
            variant: 'destructive',
            title: 'Sign-In Failed',
            description: `Error finishing sign-in: ${error.message}`,
          });
        }
        setRedirectProcessed(true);
      } finally {
        setRedirectLoading(false);
      }
    };
    
    processRedirect();
  }, [toast, router]);

  useEffect(() => {
    const auth = getAuthWithPersistence();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          setIsAdmin(!!tokenResult.claims.admin);
        } catch (error) {
          console.error('Error getting user token:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, redirectLoading, redirectProcessed }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
