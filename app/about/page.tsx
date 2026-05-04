'use client'

import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'
import communityData from '@/content/community.json'
import { ExternalLink } from 'lucide-react'

export default function AboutPage() {
  const { t } = useLanguage()

  const pillars = [
    { icon: '🌟', titleKey: 'about_pillar_courses',   descKey: 'about_pillar_courses_d' },
    { icon: '🔴', titleKey: 'about_pillar_live',      descKey: 'about_pillar_live_d' },
    { icon: '💬', titleKey: 'about_pillar_community', descKey: 'about_pillar_community_d' },
    { icon: '🗓️', titleKey: 'about_pillar_events',    descKey: 'about_pillar_events_d' },
  ]

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Hero */}
        <div className="post-card overflow-hidden">
          <div className="h-40 relative" style={{ background: 'linear-gradient(135deg, #C8942A 0%, #E07B2A 100%)' }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px), radial-gradient(circle at 70% 30%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent" />
          </div>
          <div className="p-6">
            <h1 className="font-display text-3xl font-light mb-2" style={{ color: '#2C1F0E' }}>{communityData.name}</h1>
            <p style={{ color: '#6B4F35' }} className="leading-relaxed">{communityData.description}</p>
          </div>
        </div>

        {/* About the creator */}
        <div className="post-card p-6">
          <h2 className="font-display text-xl font-light mb-4" style={{ color: '#2C1F0E' }}>{t('about_creator')}</h2>
          <div className="flex items-start gap-4">
            <div className="avatar w-16 h-16 text-xl bg-brand-100 text-brand-600 font-semibold flex-shrink-0">
              {communityData.owner.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: '#2C1F0E' }}>{communityData.owner.name}</h3>
              <p className="text-sm text-brand-600 mb-2">{communityData.owner.title}</p>
              <p className="text-sm leading-relaxed" style={{ color: '#6B4F35' }}>
                {communityData.owner.bio}
                {communityData.owner.bio === 'Guía espiritual y creadora de contenido de bienestar.' && (
                  <span className="block mt-1 text-amber-600 text-xs">✏️ Edita tu bio en <code>content/community.json</code></span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Community pillars */}
        <div className="post-card p-6">
          <h2 className="font-display text-xl font-light mb-4" style={{ color: '#2C1F0E' }}>{t('about_pillars')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((item) => (
              <div key={item.titleKey} className="flex gap-3 p-3 rounded-xl" style={{ background: '#FFF9F0' }}>
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="font-medium text-sm" style={{ color: '#2C1F0E' }}>{t(item.titleKey)}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#A8906C' }}>{t(item.descKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        {communityData.links.length > 0 && (
          <div className="post-card p-6">
            <h2 className="font-display text-xl font-light mb-4" style={{ color: '#2C1F0E' }}>{t('about_links')}</h2>
            <div className="space-y-2">
              {communityData.links.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
                  <ExternalLink size={14} />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
