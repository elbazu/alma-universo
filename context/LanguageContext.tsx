'use client'

/**
 * context/LanguageContext.tsx
 *
 * Provides { lang, setLang, t } to the entire app.
 * Language choice is persisted in localStorage so it survives reloads.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { translations, type Lang } from '@/lib/translations'

interface LanguageContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
  t: (k) => k,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('alma_lang') as Lang | null
      if (stored === 'es' || stored === 'en') setLangState(stored)
    } catch {}
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    try { localStorage.setItem('alma_lang', l) } catch {}
  }

  function t(key: string): string {
    return translations[lang][key] ?? translations['es'][key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
