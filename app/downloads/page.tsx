'use client'

import AppShell from '@/components/layout/AppShell'
import { Download } from 'lucide-react'

export default function DownloadsPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 36,
          fontWeight: 300, color: '#2C1F0E', marginBottom: 8 }}>
          Mis Descargas
        </h1>
        <p style={{ fontSize: 14, color: '#6B4F35', marginBottom: 48 }}>
          Tus recursos descargables aparecerán aquí.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '64px 0', gap: 16,
          border: '1px dashed #E8DECE', borderRadius: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%',
            background: '#FFF0D6', display: 'flex', alignItems: 'center',
            justifyContent: 'center' }}>
            <Download size={22} style={{ color: '#C8942A' }} />
          </div>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: '0.1em',
            color: '#A8906C', textAlign: 'center' }}>
            PRÓXIMAMENTE
          </p>
          <p style={{ fontSize: 13, color: '#A8906C', textAlign: 'center', maxWidth: 300 }}>
            Materiales de estudio, guías y recursos de tus cursos estarán disponibles aquí.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
