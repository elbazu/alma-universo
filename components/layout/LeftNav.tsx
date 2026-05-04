'use client'

/**
 * LeftNav — permanent left sidebar navigation for all interior pages.
 * Replaces the top Navbar. Warm ivory/gold palette matching the prototype.
 * Sprint 10: language toggle (ES / EN) added above user footer.
 */

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useCommunitySettings } from '@/context/CommunityDataContext'
import { useCommunitySettingsModal } from '@/context/CommunitySettingsContext'
import { useProfile } from '@/context/ProfileContext'
import { useLanguage } from '@/context/LanguageContext'
import { isAdmin } from '@/lib/admin'
import { displayName as profileDisplayName } from '@/lib/profile'
import {
  Home, BookOpen, Download, CalendarDays, MessageCircle,
  Map, Users, User, Settings, Info, LogOut, Settings2, Menu, X,
} from 'lucide-react'

const C = {
  bg:         '#FFF9F0',
  border:     '#E8DECE',
  gold:       '#C8942A',
  amber:      '#E07B2A',
  text:       '#2C1F0E',
  textMid:    '#6B4F35',
  textDim:    '#A8906C',
  activeBg:   '#FFF0D6',
  hoverBg:    '#FFF4E6',
}

// ─── MetatronCube mini mark ───────────────────────────────────────────────────

function MiniMark() {
  return (
    <svg viewBox="-50 -50 100 100" width="32" height="32" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id="lnmg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="100%" stopColor="#C8942A" />
        </linearGradient>
      </defs>
      {[0,1,2,3,4,5].map(i => {
        const a = (i * 60 - 30) * Math.PI / 180
        return <circle key={i} cx={22 * Math.cos(a)} cy={22 * Math.sin(a)} r={22}
          fill="none" stroke="url(#lnmg)" strokeWidth="1.2" opacity="0.75" />
      })}
      <circle cx="0" cy="0" r="22" fill="none" stroke="url(#lnmg)" strokeWidth="1.4" opacity="0.9" />
      <circle cx="0" cy="0" r="3.5" fill="#FFE08A" opacity="0.95" />
      <circle cx="0" cy="0" r="1.5" fill="white" />
    </svg>
  )
}

// ─── Language toggle pill ─────────────────────────────────────────────────────

function LangToggle() {
  const { lang, setLang } = useLanguage()
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '6px 10px', marginBottom: 10,
    }}>
      <span style={{ fontSize: 10, color: C.textDim, fontFamily: 'Cinzel, serif',
        letterSpacing: '0.1em', marginRight: 6 }}>
        IDIOMA
      </span>
      <div style={{
        display: 'flex', background: '#F0E8D8', borderRadius: 20,
        padding: 2, gap: 2,
      }}>
        {(['es', 'en'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              padding: '3px 10px', borderRadius: 16, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', transition: 'all .15s',
              background: lang === l ? C.gold : 'transparent',
              color: lang === l ? 'white' : C.textDim,
              fontFamily: "'Jost', sans-serif",
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { openCommunitySettings } = useCommunitySettingsModal()
  const { profile } = useProfile()
  const { t } = useLanguage()
  const userIsAdmin = isAdmin(user)

  const displayName = profileDisplayName(
    profile,
    (user?.name as string) || (user?.email as string) || 'Usuario'
  )
  const initial   = displayName.charAt(0).toUpperCase()
  const avatarUrl = profile?.avatar_url

  function isActive(href: string) {
    if (href === '/home') return pathname === '/home' || pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const NAV_SECTIONS = [
    {
      sectionKey: 'nav_section_principal',
      items: [
        { labelKey: 'nav_home',      href: '/home',      icon: <Home size={16} /> },
        { labelKey: 'nav_courses',   href: '/classroom', icon: <BookOpen size={16} /> },
        { labelKey: 'nav_downloads', href: '/downloads', icon: <Download size={16} /> },
        { labelKey: 'nav_calendar',  href: '/calendar',  icon: <CalendarDays size={16} /> },
      ],
    },
    {
      sectionKey: 'nav_section_comunidad',
      items: [
        { labelKey: 'nav_community', href: '/community', icon: <MessageCircle size={16} /> },
        { labelKey: 'nav_map',       href: '/map',       icon: <Map size={16} /> },
        { labelKey: 'nav_members',   href: '/members',   icon: <Users size={16} /> },
      ],
    },
    {
      sectionKey: 'nav_section_cuenta',
      items: [
        { labelKey: 'nav_profile',   href: '/members',  icon: <User size={16} /> },
        { labelKey: 'nav_settings',  href: '/settings', icon: <Settings size={16} /> },
        { labelKey: 'nav_about',     href: '/about',    icon: <Info size={16} /> },
      ],
    },
  ]

  return (
    <div style={{
      width: 220, height: '100vh', position: 'sticky', top: 0,
      background: C.bg, borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: "'Jost', sans-serif",
    }}>

      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MiniMark />
          <div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: '0.1em',
              color: C.gold, lineHeight: 1.2 }}>MI ALMA</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: '0.1em',
              color: C.textMid, lineHeight: 1.2 }}>EN EL UNIVERSO</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: C.textDim, padding: 4 }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 8px' }}>
        {NAV_SECTIONS.map(({ sectionKey, items }) => (
          <div key={sectionKey} style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.14em',
              color: C.textDim, padding: '0 8px 6px', textTransform: 'uppercase' }}>
              {t(sectionKey)}
            </div>
            {items.map(({ labelKey, href, icon }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href} onClick={onClose}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10, marginBottom: 2,
                    color: active ? C.gold : C.textMid,
                    background: active ? C.activeBg : 'transparent',
                    borderLeft: active ? `2px solid ${C.gold}` : '2px solid transparent',
                    fontSize: 13, fontWeight: active ? 500 : 400,
                    textDecoration: 'none', transition: 'all .15s',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = C.hoverBg
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.65 }}>{icon}</span>
                  {t(labelKey)}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Admin: community settings */}
        {userIsAdmin && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.14em',
              color: C.textDim, padding: '0 8px 6px', textTransform: 'uppercase' }}>
              {t('nav_section_admin')}
            </div>
            <button onClick={() => openCommunitySettings('general')}
              style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10, width: '100%', border: 'none',
                background: 'transparent', cursor: 'pointer', color: C.textMid,
                borderLeft: '2px solid transparent', fontSize: 13, textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ opacity: 0.65 }}><Settings2 size={16} /></span>
              {t('nav_admin_community')}
            </button>
          </div>
        )}
      </nav>

      {/* Language toggle + User footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, flexShrink: 0 }}>
        <LangToggle />
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${C.gold}, ${C.amber})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 13, fontWeight: 600, overflow: 'hidden',
            }}>
              {avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initial
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.text,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: C.textDim }}>
                {userIsAdmin ? t('nav_admin_badge') : t('nav_member_badge')}
              </div>
            </div>
          </div>
          <button onClick={signOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '7px 12px', borderRadius: 10, border: `1px solid ${C.border}`,
              background: 'transparent', cursor: 'pointer', color: C.textMid,
              fontSize: 12, fontFamily: "'Jost', sans-serif", transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid }}
          >
            <LogOut size={13} />
            {t('nav_signout')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Exported LeftNav ─────────────────────────────────────────────────────────

export default function LeftNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.textMid }}
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay + slide-in drawer */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(44,31,14,0.4)', backdropFilter: 'blur(3px)' }}
          onClick={() => setMobileOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', left: 0, top: 0, bottom: 0 }}>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
