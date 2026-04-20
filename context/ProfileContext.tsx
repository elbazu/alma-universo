'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import {
  fetchOrCreateProfile,
  updateProfile as apiUpdate,
  updateProfileAvatar as apiAvatar,
  clearProfileAvatar as apiClearAvatar,
  UserProfile,
  emptyProfile,
} from '@/lib/profile'
import { useAuth } from '@/context/AuthContext'

interface ProfileContextValue {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  /** Patch text/boolean/json fields; returns the updated profile. */
  save: (patch: Partial<UserProfile>) => Promise<UserProfile | null>
  /** Upload avatar file. */
  saveAvatar: (file: File) => Promise<UserProfile | null>
  /** Clear avatar file. */
  clearAvatar: () => Promise<UserProfile | null>
  /** Re-fetch from PB. */
  refresh: () => Promise<void>
}

const Ctx = createContext<ProfileContextValue>({
  profile: null,
  isLoading: true,
  error: null,
  save: async () => null,
  saveAvatar: async () => null,
  clearAvatar: async () => null,
  refresh: async () => {},
})

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (authLoading) return
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const p = await fetchOrCreateProfile(user.id)
      setProfile(p ?? emptyProfile(user.id))
    } catch (e) {
      setError((e as Error)?.message || 'No se pudo cargar el perfil.')
      setProfile(emptyProfile(user.id))
    } finally {
      setIsLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    load()
  }, [load])

  async function save(patch: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!profile?.id) return null
    const updated = await apiUpdate(profile.id, patch)
    setProfile(updated)
    return updated
  }

  async function saveAvatar(file: File): Promise<UserProfile | null> {
    if (!profile?.id) return null
    const updated = await apiAvatar(profile.id, file)
    setProfile(updated)
    return updated
  }

  async function clearAvatar(): Promise<UserProfile | null> {
    if (!profile?.id) return null
    const updated = await apiClearAvatar(profile.id)
    setProfile(updated)
    return updated
  }

  return (
    <Ctx.Provider value={{ profile, isLoading, error, save, saveAvatar, clearAvatar, refresh: load }}>
      {children}
    </Ctx.Provider>
  )
}

export const useProfile = () => useContext(Ctx)
