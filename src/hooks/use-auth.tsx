
'use client';

import React, { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from './use-toast';

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // We need to wait for both the redirect result and the initial auth state change.
    const processAuth = async () => {
      const redirectResultPromise = getRedirectResult(auth)
        .then((result) => {
          if (result) {
            toast({
              title: "Signed In Successfully",
              description: `Welcome back, ${result.user.displayName || 'user'}!`,
            });
          }
        })
        .catch((error) => {
          console.error("Auth redirect error:", error);
          toast({
            variant: "destructive",
            title: "Sign-In Failed",
            description: "There was an error during the sign-in process."
          });
        });

      const authStateReadyPromise = new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setUser(user);
          if (user) {
            try {
              const tokenResult = await user.getIdTokenResult();
              setIsAdmin(!!tokenResult.claims.admin);
            } catch (error) {
              console.error("Error getting user token:", error);
              setIsAdmin(false);
            }
          } else {
            setIsAdmin(false);
          }
          unsubscribe(); // We only need the first result to know auth is ready.
          resolve();
        });
      });
      
      // Wait for both to complete before setting loading to false
      await Promise.all([redirectResultPromise, authStateReadyPromise]);
      setLoading(false);
    };

    processAuth();
    
    // This second listener will handle live auth changes after initial load.
    const unsubscribeLive = onAuthStateChanged(auth, async (user) => {
       setUser(user);
       if (user) {
         try {
           const tokenResult = await user.getIdTokenResult();
           setIsAdmin(!!tokenResult.claims.admin);
         } catch {
            setIsAdmin(false);
         }
       } else {
         setIsAdmin(false);
       }
    });

    return () => unsubscribeLive();
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
