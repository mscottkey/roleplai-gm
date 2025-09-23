
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
    // This effect runs once on mount to handle both the redirect result
    // and the initial auth state.
    const processAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // This happens if the user just signed in via redirect.
          toast({
            title: "Signed In Successfully",
            description: `Welcome, ${result.user.displayName || 'friend'}!`,
          });
          // The onAuthStateChanged listener below will handle setting the user.
        }
      } catch (error) {
        console.error("Auth redirect error:", error);
        toast({
          variant: "destructive",
          title: "Sign-In Failed",
          description: "There was an error during the sign-in process."
        });
      }

      // Set up the listener for ongoing auth state changes.
      // This will also fire right after getRedirectResult, ensuring we have the final user state.
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
        // Crucially, set loading to false only after the first auth state has been determined.
        setLoading(false);
      });

      // Cleanup the listener on unmount
      return () => unsubscribe();
    };

    processAuth();
  }, [toast]);


  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
