'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getPb } from '@/lib/pocketbase'
import { DEFAULT_FLAGS, FlagKey } from '@/lib/flags'

type Flags = Record<FlagKey, boolean>

interface FlagsContextType {
  flags: Flags
  isLoading: boolean
  refresh: () => Promise<void>
}

const FlagsContext = createContext<FlagsContextType>({
  flags: DEFAULT_FLAGS,
  isLoading: true,
  refresh: async () => {},
})

export function FlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Flags>(DEFAULT_FLAGS)
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    try {
      const pb = getPb()
      const records = await pb.collection('feature_flags').getFullList({
        fields: 'key,enabled',
        requestKey: 'feature_flags_load',
      })

      const next: Flags = { ...DEFAULT_FLAGS }
      for (const rec of records) {
        const key = rec.key as FlagKey
        if (key in next) next[key] = Boolean(rec.enabled)
      }
      setFlags(next)
    } catch {
      // PocketBase unreachable or collection missing — keep safe defaults.
      setFlags(DEFAULT_FLAGS)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <FlagsContext.Provider value={{ flags, isLoading, refresh: load }}>
      {children}
    </FlagsContext.Provider>
  )
}

export function useFlags() {
  return useContext(FlagsContext).flags
}

export function useFlag(key: FlagKey): boolean {
  return useContext(FlagsContext).flags[key]
}

export function useFlagsLoading() {
  return useContext(FlagsContext).isLoading
}
