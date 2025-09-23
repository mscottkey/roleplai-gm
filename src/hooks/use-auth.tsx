
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
    // Handle the redirect result from Google Sign-In
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // User has successfully signed in or linked.
          // The onAuthStateChanged listener will handle the user state update.
          toast({
            title: "Signed In",
            description: `Welcome, ${result.user.displayName || 'user'}!`,
          })
        }
      })
      .catch((error) => {
        console.error("Auth redirect error:", error);
        toast({
            variant: "destructive",
            title: "Sign-In Failed",
            description: "There was an error during the sign-in process."
        });
      }).finally(() => {
         // This is also where you could stop a loading spinner specific to the redirect check
      });


    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        setIsAdmin(!!tokenResult.claims.admin);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
