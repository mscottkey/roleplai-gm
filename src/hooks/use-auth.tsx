
'use client';

import React, { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from './use-toast';

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  redirectLoading: boolean; // New state to track redirect processing
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  redirectLoading: true, // Start as true
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redirectLoading, setRedirectLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setRedirectLoading(true);
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast({
            title: "Signed In Successfully",
            description: `Welcome back, ${result.user.displayName || 'user'}!`,
          });
          // The onAuthStateChanged listener below will handle setting the user state.
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
        setRedirectLoading(false);
      });

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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, redirectLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
