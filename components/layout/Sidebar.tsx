import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import communityData from '@/content/community.json'

export default function Sidebar() {
  const { name, tagline, coverImage, stats, links, owner } = communityData

  return (
    <aside className="space-y-4 sidebar-hide w-72 flex-shrink-0">
      {/* Group card */}
      <div className="sidebar-card">
        {/* Cover image */}
        <div className="h-24 bg-gradient-to-br from-brand-400 to-brand-600 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />
        </div>

        <div className="p-4">
          <h2 className="font-display text-base font-semibold text-gray-900 leading-tight mb-1">{name}</h2>
          <p className="text-xs text-gray-400 mb-3">skool.com/{communityData.url}</p>
          <p className="text-sm text-gray-600 mb-4">{tagline}</p>

          {/* Links */}
          {links.filter(l => l.public).map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 mb-1.5">
              <ExternalLink size={12} />
              <span>{link.label}</span>
            </a>
          ))}

          {/* Stats */}
          <div className="flex border border-gray-100 rounded-lg overflow-hidden mt-4 mb-4">
            {[
              { label: 'Miembros', value: stats.members },
              { label: 'En línea', value: stats.online },
              { label: 'Admins', value: stats.admins },
            ].map((stat, i) => (
              <div key={i} className={`flex-1 p-2 text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}>
                <div className="font-semibold text-sm text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Owner */}
          <div className="flex items-center gap-2">
            <div className="avatar w-8 h-8 bg-brand-100 text-brand-600 text-sm font-semibold relative">
              {owner.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-800">{owner.name}</div>
              <div className="text-xs text-gray-500">{owner.title}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite */}
      <button className="w-full py-2 text-sm font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition">
        Invitar personas
      </button>
    </aside>
  )
}
