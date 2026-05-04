import AppShell from '@/components/layout/AppShell'
import communityData from '@/content/community.json'
import { Search, Users } from 'lucide-react'

// Placeholder members — replace with real data or a database later
const placeholderMembers = [
  { id: '1', name: communityData.owner.name, title: communityData.owner.title, level: 9, isOwner: true, joinedAt: '2025-01-01' },
]

export default function MembersPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-light mb-1" style={{ color: '#2C1F0E' }}>Miembros</h1>
            <p className="text-sm" style={{ color: '#6B4F35' }}>{communityData.stats.members} miembros · {communityData.stats.online} en línea</p>
          </div>
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Buscar miembro..." className="pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 border-b border-gray-200">
          {['Todos', 'En línea', 'Admins', 'Nuevos'].map((tab, i) => (
            <button key={tab} className={`pb-2.5 px-1 text-sm font-medium border-b-2 transition -mb-px ${i === 0 ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Members grid */}
        {placeholderMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {placeholderMembers.map(member => (
              <div key={member.id} className="post-card p-4 flex items-center gap-3">
                <div className="relative">
                  <div className="avatar w-12 h-12 text-base bg-brand-100 text-brand-600 font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <span className="level-badge">{member.level}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                    {member.isOwner && <span className="text-xs bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded font-medium">Admin</span>}
                  </div>
                  <p className="text-xs text-gray-500">{member.title}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aún no hay miembros</p>
            <p className="text-sm mt-1">Invita personas a unirse a tu comunidad.</p>
          </div>
        )}

        {/* Placeholder notice */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <strong>📌 Nota de desarrollo:</strong> Los miembros se mostrarán aquí cuando integres autenticación.
          Por ahora puedes añadir miembros manualmente en <code className="bg-amber-100 px-1 rounded">content/members/</code> o conectar una base de datos.
        </div>
      </div>
    </AppShell>
  )
}
