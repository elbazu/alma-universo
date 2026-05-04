'use client'

/**
 * Map page — Sprint 6.5
 *
 * Renders a Leaflet/OpenStreetMap showing community member locations.
 */

import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'

// Leaflet must be loaded client-side only — no SSR
const MemberMap = dynamic(() => import('@/components/map/MemberMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl border border-border bg-surface overflow-hidden flex items-center justify-center"
         style={{ height: 520 }}>
      <div className="flex flex-col items-center gap-2 text-body-muted">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Cargando mapa…</span>
      </div>
    </div>
  ),
})

export default function MapPage() {
  const { t } = useLanguage()
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-display text-3xl font-light mb-1" style={{ color: '#2C1F0E' }}>{t('map_title')}</h1>
        <p className="text-sm mb-6" style={{ color: '#6B4F35' }}>{t('map_subtitle')}</p>
        <MemberMap />
      </div>
    </AppShell>
  )
}
