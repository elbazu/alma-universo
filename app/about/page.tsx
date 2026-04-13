import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import communityData from '@/content/community.json'
import { ExternalLink } from 'lucide-react'

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 space-y-6">

            {/* Hero */}
            <div className="post-card overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-brand-400 via-brand-500 to-purple-500 relative">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px), radial-gradient(circle at 70% 30%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent" />
              </div>
              <div className="p-6">
                <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">{communityData.name}</h1>
                <p className="text-gray-600 leading-relaxed">{communityData.description}</p>
              </div>
            </div>

            {/* About the creator */}
            <div className="post-card p-6">
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-4">Sobre la Creadora</h2>
              <div className="flex items-start gap-4">
                <div className="avatar w-16 h-16 text-xl bg-brand-100 text-brand-600 font-semibold flex-shrink-0">
                  {communityData.owner.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{communityData.owner.name}</h3>
                  <p className="text-sm text-brand-600 mb-2">{communityData.owner.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
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
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-4">¿Qué encontrarás aquí?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: '🌟', title: 'Cursos y lecciones', desc: 'Contenido exclusivo para tu crecimiento personal y espiritual.' },
                  { icon: '🔴', title: 'Clases en vivo', desc: 'Sesiones grupales donde nos conectamos en tiempo real.' },
                  { icon: '💬', title: 'Comunidad activa', desc: 'Un espacio seguro para compartir, preguntar y crecer juntas.' },
                  { icon: '🗓️', title: 'Eventos y rituales', desc: 'Celebraciones, lunaciones, meditaciones grupales y más.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            {communityData.links.length > 0 && (
              <div className="post-card p-6">
                <h2 className="font-display text-xl font-semibold text-gray-900 mb-4">Redes y enlaces</h2>
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
          <Sidebar />
        </div>
      </main>
    </>
  )
}
