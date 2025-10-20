'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const login = useCallback((provider?: string, callbackUrl?: string) => {
    signIn(provider, { callbackUrl: callbackUrl || '/' })
  }, [])

  const logout = useCallback(async (callbackUrl?: string) => {
    await signOut({ callbackUrl: callbackUrl || '/' })
  }, [])

  const requireAuth = useCallback((redirectTo?: string) => {
    if (status === 'loading') return false
    if (!session) {
      router.push(redirectTo || '/auth/signin')
      return false
    }
    return true
  }, [session, status, router])

  return {
    user: session?.user,
    session,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    login,
    logout,
    requireAuth,
  }
}