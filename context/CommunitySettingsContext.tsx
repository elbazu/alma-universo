'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import CommunitySettingsModal from '@/components/community-settings/CommunitySettingsModal'

type PaneKey = 'general' | 'tabs' | 'billing'

interface CommunitySettingsContextType {
  openCommunitySettings: (pane?: PaneKey) => void
  closeCommunitySettings: () => void
}

const CommunitySettingsContext = createContext<CommunitySettingsContextType>({
  openCommunitySettings: () => {},
  closeCommunitySettings: () => {},
})

export function CommunitySettingsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pane, setPane] = useState<PaneKey>('general')

  return (
    <CommunitySettingsContext.Provider
      value={{
        openCommunitySettings: (p) => { if (p) setPane(p); setOpen(true) },
        closeCommunitySettings: () => setOpen(false),
      }}
    >
      {children}
      <CommunitySettingsModal open={open} onClose={() => setOpen(false)} initialPane={pane} />
    </CommunitySettingsContext.Provider>
  )
}

export const useCommunitySettingsModal = () => useContext(CommunitySettingsContext)
