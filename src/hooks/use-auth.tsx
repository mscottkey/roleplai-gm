'use client';

import React, { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { getAuthWithPersistence } from '@/lib/firebase';
import { useToast } from './use-toast';

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  redirectLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  redirectLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redirectLoading, setRedirectLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const auth = getAuthWithPersistence();
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        console.log('[auth] getRedirectResult =>', result);
        if (result) {
          toast({
            title: 'Signed In Successfully',
            description: `Welcome, ${result.user.displayName || result.user.email || 'friend'}!`,
          });
        }
      } catch (error: any) {
        console.error('[auth] getRedirectResult error', error);
        toast({
          variant: 'destructive',
          title: 'Sign-In Failed',
          description: `Error finishing sign-in: ${error.message}`,
        });
      } finally {
        setRedirectLoading(false);
      }
    };
    processRedirect();
  }, [toast]);

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
    <AuthContext.Provider value={{ user, isAdmin, loading, redirectLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
