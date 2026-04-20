'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Search, Bell, MessageCircle, ChevronDown, LogOut, Settings, Settings2, BookOpen } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useCommunitySettingsModal } from '@/context/CommunitySettingsContext'
import { useCommunitySettings } from '@/context/CommunityDataContext'
import { useFlag } from '@/context/FlagsContext'
import { useProfile } from '@/context/ProfileContext'
import { isAdmin } from '@/lib/admin'
import { displayName as profileDisplayName } from '@/lib/profile'

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
  const initial = displayName.charAt(0).toUpperCase()
  const avatarUrl = profile?.avatar_url

  const visibleTabs = TABS.filter(t => !t.visibleKey || community[t.visibleKey])

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top row */}
        <div className="flex items-center h-14 gap-3">
          {/* Community name + course switcher */}
          <Link href="/community" className="flex items-center gap-2 flex-shrink-0 mr-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center overflow-hidden">
              {community.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={community.icon_url} alt={community.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">
                  {community.name.charAt(0)}
                </span>
              )}
            </div>
            <span className="font-semibold text-sm text-body leading-tight hidden sm:block">
              {community.name}
            </span>
            <ChevronDown size={14} className="text-body-muted hidden sm:block" />
          </Link>

          {/* Search */}
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

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {chatEnabled && (
              <button className="p-2 rounded-lg hover:bg-surface-secondary text-body-muted transition">
                <MessageCircle size={20} />
              </button>
            )}
            <button className="p-2 rounded-lg hover:bg-surface-secondary text-body-muted transition">
              <Bell size={20} />
            </button>

            {/* Avatar + dropdown */}
            <div className="relative group">
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
