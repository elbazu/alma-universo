'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getPb } from '@/lib/pocketbase'
import type { RecordModel } from 'pocketbase'

interface AuthContextType {
  user: RecordModel | null
  isLoading: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const pb = getPb()

    // Set initial user from stored auth
    setUser(pb.authStore.record ?? null)
    setIsLoading(false)

    // Listen for changes (login / logout)
    const unsub = pb.authStore.onChange((_token, record) => {
      setUser(record ?? null)
    })

    return () => unsub()
  }, [])

  function signOut() {
    const pb = getPb()
    pb.authStore.clear()
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
