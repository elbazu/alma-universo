'use client'

/**
 * Navbar — top navigation bar.
 *
 * Sprint 5 additions:
 * - Community name + ChevronDown opens course switcher dropdown.
 * - Bell icon opens notifications panel.
 * - Chat icon opens chat/messages panel.
 */

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  Search, Bell, MessageCircle, ChevronDown, LogOut,
  Settings, Settings2, BookOpen, PlayCircle, X, Check,
} from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useCommunitySettingsModal } from '@/context/CommunitySettingsContext'
import { useCommunitySettings } from '@/context/CommunityDataContext'
import { useFlag } from '@/context/FlagsContext'
import { useProfile } from '@/context/ProfileContext'
import { isAdmin } from '@/lib/admin'
import { displayName as profileDisplayName } from '@/lib/profile'
import { listPublishedCourses, adminListCourses } from '@/lib/classroom-crud'
import type { CourseAdmin } from '@/lib/classroom-crud'

interface Tab {
  label: string
  href: string
  visibleKey?:
    | 'show_classroom_tab'
    | 'show_calendar_tab'
    | 'show_map_tab'
    | 'show_members_tab'
    | 'show_about_tab'
}

const TABS: Tab[] = [
  { label: 'Comunidad',  href: '/community' },
  { label: 'Classroom',  href: '/classroom', visibleKey: 'show_classroom_tab' },
  { label: 'Calendario', href: '/calendar',  visibleKey: 'show_calendar_tab' },
  { label: 'Mapa',       href: '/map',       visibleKey: 'show_map_tab' },
  { label: 'Miembros',   href: '/members',   visibleKey: 'show_members_tab' },
  { label: 'Acerca de',  href: '/about',     visibleKey: 'show_about_tab' },
]

// ─── Course switcher dropdown ─────────────────────────────────────────────────

function CourseSwitcher({
  isAdmin: adminUser,
  onClose,
}: {
  isAdmin: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseAdmin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fn = adminUser ? adminListCourses : listPublishedCourses
    fn().then(list => { setCourses(list); setLoading(false) })
  }, [adminUser])

  function goToCourse(course: CourseAdmin) {
    if (course.slug) {
      router.push(`/classroom/${course.slug}`)
    } else {
      router.push('/classroom')
    }
    onClose()
  }

  return (
    <div className="absolute left-0 top-full mt-1 w-64 bg-surface rounded-xl shadow-lg border border-border py-2 z-50">
      <div className="px-3 pb-2 border-b border-border mb-1">
        <p className="text-xs font-semibold text-body-muted uppercase tracking-wide">Cursos</p>
      </div>
      {loading ? (
        <div className="px-3 py-3 text-xs text-body-muted text-center">Cargando…</div>
      ) : courses.length === 0 ? (
        <div className="px-3 py-3 text-xs text-body-muted text-center">Sin cursos publicados.</div>
      ) : (
        courses.map(course => (
          <button
            key={course.id}
            onClick={() => goToCourse(course)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-body hover:bg-surface-secondary transition text-left"
          >
            {course.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-7 h-7 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-md bg-brand-100 flex items-center justify-center flex-shrink-0">
                <PlayCircle size={13} className="text-brand-500" />
              </div>
            )}
            <span className="truncate leading-tight">{course.title}</span>
          </button>
        ))
      )}
      <div className="mt-1 border-t border-border pt-1">
        <button
          onClick={() => { router.push('/classroom'); onClose() }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-600 hover:bg-surface-secondary transition"
        >
          <BookOpen size={12} /> Ver todos los cursos
        </button>
      </div>
    </div>
  )
}

// ─── Notifications panel ──────────────────────────────────────────────────────

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  // Placeholder — real notifications require a PB collection in a future sprint
  return (
    <div className="absolute right-0 top-full mt-1 w-80 bg-surface rounded-xl shadow-lg border border-border z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-body">Notificaciones</p>
        <button onClick={onClose} className="p-1 text-body-muted hover:text-body rounded transition">
          <X size={14} />
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
        <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center mb-1">
          <Check size={18} className="text-brand-400" />
        </div>
        <p className="text-sm font-medium text-body">Todo al día</p>
        <p className="text-xs text-body-muted">No tienes notificaciones nuevas.</p>
      </div>
    </div>
  )
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({ onClose }: { onClose: () => void }) {
  // Placeholder — real DMs require a PB messages collection in a future sprint
  return (
    <div className="absolute right-0 top-full mt-1 w-80 bg-surface rounded-xl shadow-lg border border-border z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-body">Mensajes</p>
        <button onClick={onClose} className="p-1 text-body-muted hover:text-body rounded transition">
          <X size={14} />
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
        <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center mb-1">
          <MessageCircle size={18} className="text-brand-400" />
        </div>
        <p className="text-sm font-medium text-body">Sin mensajes</p>
        <p className="text-xs text-body-muted">Los mensajes directos estarán disponibles pronto.</p>
      </div>
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { openSettings } = useSettings()
  const { openCommunitySettings } = useCommunitySettingsModal()
  const community = useCommunitySettings()
  const { profile } = useProfile()
  const chatEnabled = useFlag('chat_enabled')
  const userIsAdmin = isAdmin(user)

  const displayName =
    profileDisplayName(profile, (user?.name as string) || (user?.email as string) || community.name)
  const initial    = displayName.charAt(0).toUpperCase()
  const avatarUrl  = profile?.avatar_url

  const visibleTabs = TABS.filter(t => !t.visibleKey || community[t.visibleKey])

  // Dropdown open states
  const [switcherOpen, setSwitcherOpen]   = useState(false)
  const [notifOpen,    setNotifOpen]      = useState(false)
  const [chatOpen,     setChatOpen]       = useState(false)

  // Refs for outside-click detection
  const switcherRef = useRef<HTMLDivElement>(null)
  const notifRef    = useRef<HTMLDivElement>(null)
  const chatRef     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false)
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setNotifOpen(false)
      if (chatRef.current     && !chatRef.current.contains(e.target as Node))     setChatOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top row */}
        <div className="flex items-center h-14 gap-3">

          {/* ── Community name + course switcher ─────────────────────── */}
          <div ref={switcherRef} className="relative flex-shrink-0 mr-2">
            <button
              onClick={() => {
                setSwitcherOpen(o => !o)
                setNotifOpen(false)
                setChatOpen(false)
              }}
              className="flex items-center gap-2 rounded-lg hover:bg-surface-secondary px-2 py-1 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center overflow-hidden">
                {community.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={community.icon_url} alt={community.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold">{community.name.charAt(0)}</span>
                )}
              </div>
              <span className="font-semibold text-sm text-body leading-tight hidden sm:block">
                {community.name}
              </span>
              <ChevronDown
                size={14}
                className={`text-body-muted hidden sm:block transition-transform ${switcherOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {switcherOpen && (
              <CourseSwitcher
                isAdmin={userIsAdmin}
                onClose={() => setSwitcherOpen(false)}
              />
            )}
          </div>

          {/* ── Search ──────────────────────────────────────────────── */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-muted" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface-secondary text-body placeholder:text-body-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-surface transition"
              />
            </div>
          </div>

          {/* ── Actions ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Chat */}
            {chatEnabled && (
              <div ref={chatRef} className="relative">
                <button
                  onClick={() => {
                    setChatOpen(o => !o)
                    setNotifOpen(false)
                    setSwitcherOpen(false)
                  }}
                  className={`p-2 rounded-lg transition ${
                    chatOpen
                      ? 'bg-surface-secondary text-body'
                      : 'hover:bg-surface-secondary text-body-muted'
                  }`}
                >
                  <MessageCircle size={20} />
                </button>
                {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
              </div>
            )}

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => {
                  setNotifOpen(o => !o)
                  setChatOpen(false)
                  setSwitcherOpen(false)
                }}
                className={`p-2 rounded-lg transition ${
                  notifOpen
                    ? 'bg-surface-secondary text-body'
                    : 'hover:bg-surface-secondary text-body-muted'
                }`}
              >
                <Bell size={20} />
              </button>
              {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
            </div>

            {/* Avatar + dropdown */}
            <div className="relative group ml-1">
              <div className="avatar w-9 h-9 cursor-pointer bg-brand-100 text-brand-600 text-sm font-semibold overflow-hidden">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="absolute right-0 top-full mt-1 w-56 bg-surface text-body rounded-xl shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                {user?.email && (
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-medium truncate">{displayName}</p>
                    <p className="text-xs text-body-secondary truncate">{user.email as string}</p>
                  </div>
                )}
                <button
                  onClick={() => openSettings('profile')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-body-secondary hover:text-body hover:bg-surface-secondary transition-colors"
                >
                  <Settings size={14} />
                  Configuración
                </button>
                <button
                  onClick={() => openSettings('mis-cursos')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-body-secondary hover:text-body hover:bg-surface-secondary transition-colors border-t border-border"
                >
                  <BookOpen size={14} />
                  Mis cursos
                </button>
                {userIsAdmin && (
                  <button
                    onClick={() => openCommunitySettings('general')}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-body-secondary hover:text-body hover:bg-surface-secondary transition-colors border-t border-border"
                  >
                    <Settings2 size={14} />
                    Configurar comunidad
                  </button>
                )}
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-body-secondary hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-b-xl transition-colors border-t border-border"
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-6 overflow-x-auto no-scrollbar">
          {visibleTabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`pb-3 pt-1 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-body-secondary hover:text-body'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
