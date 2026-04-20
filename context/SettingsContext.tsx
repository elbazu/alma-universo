'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import SettingsModal from '@/components/settings/SettingsModal'

type PaneKey =
  | 'profile'
  | 'mis-cursos'
  | 'appearance'
  | 'notifications'
  | 'billing'
  | 'account'

interface SettingsContextType {
  openSettings: (pane?: PaneKey) => void
  closeSettings: () => void
}

const SettingsContext = createContext<SettingsContextType>({
  openSettings: () => {},
  closeSettings: () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pane, setPane] = useState<PaneKey>('profile')

  return (
    <SettingsContext.Provider
      value={{
        openSettings: (p) => { if (p) setPane(p); setOpen(true) },
        closeSettings: () => setOpen(false),
      }}
    >
      {children}
      <SettingsModal open={open} onClose={() => setOpen(false)} initialPane={pane} />
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
