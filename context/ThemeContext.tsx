'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  choice: ThemeChoice
  resolved: ResolvedTheme
  setChoice: (c: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeContextType>({
  choice: 'system',
  resolved: 'light',
  setChoice: () => {},
})

const STORAGE_KEY = 'alma-theme'

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = resolved
  if (resolved === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

function resolve(choice: ThemeChoice): ResolvedTheme {
  if (choice === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return choice
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>('system')
  const [resolved, setResolved] = useState<ResolvedTheme>('light')

  // Initial hydration from localStorage
  useEffect(() => {
    const stored = (typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEY)
      : null) as ThemeChoice | null
    const initial = stored ?? 'system'
    setChoiceState(initial)
    const r = resolve(initial)
    setResolved(r)
    applyTheme(r)
  }, [])

  // React to OS-level changes while on "system"
  useEffect(() => {
    if (choice !== 'system' || typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r: ResolvedTheme = mq.matches ? 'dark' : 'light'
      setResolved(r)
      applyTheme(r)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [choice])

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next)
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next)
    const r = resolve(next)
    setResolved(r)
    applyTheme(r)
  }, [])

  return (
    <ThemeContext.Provider value={{ choice, resolved, setChoice }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
