
'use client'

import React, { useState, useEffect, useContext, createContext } from 'react'
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useToast } from './use-toast'

type AuthContextType = {
  user: User | null
  isAdmin: boolean
  loading: boolean
  redirectLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  redirectLoading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [redirectLoading, setRedirectLoading] = useState(true)
  const { toast } = useToast()

  // Handle the Google redirect result exactly once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await getRedirectResult(auth)
        console.log('[auth] getRedirectResult =>', result)
        if (result && !cancelled) {
          toast({
            title: 'Signed In',
            description: `Welcome, ${result.user.displayName || result.user.email || 'player'}!`,
          })
        }
      } catch (e) {
        console.error('[auth] getRedirectResult error', e)
        toast({ variant: 'destructive', title: 'Sign-In Failed', description: 'Error finishing sign-in.' })
      } finally {
        if (!cancelled) setRedirectLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [toast])

  // Subscribe to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log('[auth] onAuthStateChanged user =>', u?.uid || null)
      setUser(u)
      if (u) {
        try {
          const tokenResult = await u.getIdTokenResult()
          setIsAdmin(!!tokenResult.claims.admin)
        } catch {
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, redirectLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
