'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Search, Bell, MessageCircle, ChevronDown, LogOut } from 'lucide-react'
import communityData from '@/content/community.json'

const tabs = [
  { label: 'Comunidad', href: '/community' },
  { label: 'Classroom', href: '/classroom' },
  { label: 'Calendario', href: '/calendar' },
  { label: 'Miembros', href: '/members' },
  { label: 'Acerca de', href: '/about' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const displayName = user?.name || user?.email || communityData.owner.name
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top row */}
        <div className="flex items-center h-14 gap-3">
          {/* Community name */}
          <Link href="/community" className="flex items-center gap-2 flex-shrink-0 mr-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-content-center overflow-hidden">
              <span className="text-white text-xs font-bold w-full h-full flex items-center justify-center">
                {communityData.name.charAt(0)}
              </span>
            </div>
            <span className="font-semibold text-sm text-gray-900 leading-tight hidden sm:block">
              {communityData.name}
            </span>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <MessageCircle size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Bell size={20} />
            </button>

            {/* Avatar + dropdown */}
            <div className="relative group">
              <div className="avatar w-9 h-9 cursor-pointer bg-brand-100 text-brand-600 text-sm font-semibold">
                {initial}
              </div>
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                {user?.email && (
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-b-xl transition-colors"
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
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`pb-3 pt-1 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
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
