'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import {
  CommunitySettings,
  COMMUNITY_FALLBACK,
  fetchCommunitySettings,
  updateCommunitySettings,
  updateCommunityFiles,
} from '@/lib/community'

interface CommunityDataContextType {
  settings: CommunitySettings
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  save: (patch: Partial<Omit<CommunitySettings, 'id' | 'icon_url' | 'cover_url'>>) => Promise<void>
  saveFiles: (files: { icon?: File; cover?: File }) => Promise<void>
}

const CommunityDataContext = createContext<CommunityDataContextType>({
  settings: COMMUNITY_FALLBACK,
  isLoading: true,
  error: null,
  refresh: async () => {},
  save: async () => {},
  saveFiles: async () => {},
})

export function CommunityDataProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CommunitySettings>(COMMUNITY_FALLBACK)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const next = await fetchCommunitySettings()
      setSettings(next)
      setError(null)
    } catch (e) {
      setError((e as Error)?.message || 'No se pudo cargar la configuración.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save: CommunityDataContextType['save'] = async (patch) => {
    if (!settings.id) {
      setError('La configuración todavía no existe en PocketBase. Importá la colección primero.')
      return
    }
    try {
      const next = await updateCommunitySettings(settings.id, patch)
      setSettings(next)
      setError(null)
    } catch (e) {
      setError((e as Error)?.message || 'No se pudo guardar.')
      throw e
    }
  }

  const saveFiles: CommunityDataContextType['saveFiles'] = async (files) => {
    if (!settings.id) {
      setError('La configuración todavía no existe en PocketBase. Importá la colección primero.')
      return
    }
    try {
      const next = await updateCommunityFiles(settings.id, files)
      setSettings(next)
      setError(null)
    } catch (e) {
      setError((e as Error)?.message || 'No se pudieron subir las imágenes.')
      throw e
    }
  }

  return (
    <CommunityDataContext.Provider value={{ settings, isLoading, error, refresh: load, save, saveFiles }}>
      {children}
    </CommunityDataContext.Provider>
  )
}

export function useCommunityData() {
  return useContext(CommunityDataContext)
}

export function useCommunitySettings() {
  return useContext(CommunityDataContext).settings
}
