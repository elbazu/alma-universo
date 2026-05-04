'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Lock, Loader2, AlertCircle, FileText } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { getPb } from '@/lib/pocketbase'
import { listDownloads, type DownloadRecord } from '@/lib/downloads'
import { useLanguage } from '@/context/LanguageContext'

// ─── Download card ────────────────────────────────────────────────────────────

function DownloadCard({ item }: { item: DownloadRecord }) {
  const { lang, t } = useLanguage()
  const title       = (lang === 'en' && item.title_en) ? item.title_en : item.title
  const description = (lang === 'en' && item.description_en) ? item.description_en : item.description
  const isLocked    = !item.is_free && !!item.required_course

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #E8DECE', boxShadow: '0 2px 12px rgba(120,80,20,0.08)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Thumbnail or placeholder */}
      <div style={{
        height: 120,
        background: item.thumbnail_url
          ? `url(${item.thumbnail_url}) center/cover`
          : 'linear-gradient(135deg, #FFF0D6 0%, #FAF7F2 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {!item.thumbnail_url && (
          <FileText size={36} style={{ color: '#C8942A', opacity: 0.45 }} />
        )}
        {item.is_free && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: '#E8F5ED', color: '#4A8C5C',
            fontSize: 10, fontFamily: 'Cinzel, serif', letterSpacing: '0.08em',
            padding: '3px 10px', borderRadius: 20, border: '1px solid #4A8C5C33',
          }}>
            {t('downloads_free_badge')}
          </span>
        )}
        {isLocked && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            background: '#FFF9F0', color: '#A8906C',
            fontSize: 10, padding: '3px 8px', borderRadius: 20,
            border: '1px solid #E8DECE', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Lock size={10} /> {t('downloads_btn_locked')}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18,
          fontWeight: 400, color: '#2C1F0E', lineHeight: 1.3, margin: 0,
        }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: 13, color: '#6B4F35', lineHeight: 1.6, margin: 0, flex: 1 }}>
            {description}
          </p>
        )}
        {isLocked && item.required_course_name && (
          <p style={{ fontSize: 12, color: '#A8906C', margin: 0 }}>
            🔒 {t('downloads_locked')} <strong>{item.required_course_name}</strong>
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '0 18px 18px' }}>
        {isLocked ? (
          <div style={{
            padding: '10px 16px', borderRadius: 10, textAlign: 'center',
            background: '#F5F0E8', color: '#A8906C',
            fontSize: 13, fontFamily: "'Jost', sans-serif",
          }}>
            🔒 {t('downloads_btn_locked')}
          </div>
        ) : (
          <a
            href={item.file_url}
            target="_blank"
            rel="noopener noreferrer"
            download
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 10, textDecoration: 'none',
              background: 'linear-gradient(135deg, #C8942A, #E07B2A)',
              color: 'white', fontSize: 13, fontFamily: 'Cinzel, serif',
              letterSpacing: '0.06em', boxShadow: '0 4px 14px rgba(200,148,42,0.3)',
            }}
          >
            <Download size={14} />
            {t('downloads_btn')}
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DownloadsPage() {
  const router   = useRouter()
  const { t }    = useLanguage()
  const pb       = getPb()
  const loggedIn = !!pb.authStore.record

  const [downloads, setDownloads] = useState<DownloadRecord[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)

  useEffect(() => {
    if (!loggedIn) { router.push('/'); return }
    listDownloads()
      .then(data => { setDownloads(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [loggedIn, router])

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 60px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 36,
          fontWeight: 300, color: '#2C1F0E', marginBottom: 8,
        }}>
          {t('downloads_title')}
        </h1>
        <p style={{ fontSize: 14, color: '#6B4F35', marginBottom: 40 }}>
          {t('downloads_subtitle')}
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={24} style={{ color: '#C8942A', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            border: '1px dashed #E8DECE', borderRadius: 20,
          }}>
            <AlertCircle size={24} style={{ color: '#E57373', marginBottom: 8 }} />
            <p style={{ fontSize: 14, color: '#A8906C' }}>{t('downloads_error')}</p>
          </div>
        ) : downloads.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '64px 0', gap: 16,
            border: '1px dashed #E8DECE', borderRadius: 20,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#FFF0D6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Download size={22} style={{ color: '#C8942A' }} />
            </div>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: '0.1em',
              color: '#A8906C', textAlign: 'center' }}>
              {t('downloads_empty').toUpperCase()}
            </p>
            <p style={{ fontSize: 13, color: '#A8906C', textAlign: 'center', maxWidth: 300, margin: 0 }}>
              {t('downloads_empty_sub')}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 24,
          }}>
            {downloads.map(item => (
              <DownloadCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </AppShell>
  )
}
