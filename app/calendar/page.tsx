import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import eventsData from '@/content/events.json'
import { Video, Calendar, Clock, Repeat, ExternalLink } from 'lucide-react'
import type { Event } from '@/lib/types'

const typeConfig = {
  live:       { label: 'EN VIVO',   color: 'bg-red-500',   icon: Video },
  meditation: { label: 'MEDITACIÓN', color: 'bg-purple-500', icon: Calendar },
  workshop:   { label: 'TALLER',    color: 'bg-blue-500',  icon: Calendar },
}

export default function CalendarPage() {
  const events = eventsData as Event[]

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-semibold text-gray-900 mb-1">Calendario</h1>
            <p className="text-sm text-gray-500 mb-6">Pr̳roximos eventos, clases en vivo y sesiones grupales.</p>

            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map(event => <EventCard key={event.id} event={event} />)}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🗓️</div>
                <p className="font-medium">No hay eventos programados</p>
                <p className="text-sm mt-1">Los próximos eventos aparecerán aquí.</p>
              </div>
            )}
          </div>
          <Sidebar />
        </div>
      </main>
    </>
  )
}

function EventCard({ event }: { event: Event }) {
  const cfg = typeConfig[event.type] || typeConfig.live
  const Icon = cfg.icon
  const dateObj = new Date(`${event.date}T${event.time}`)
  const formatted = dateObj.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="post-card p-4 flex gap-4">
      {/* Date block */}
      <div className="w-14 flex-shrink-0 text-center">
        <div className="text-xs font-medium text-brand-500 uppercase">
          {dateObj.toLocaleDateString('es', { month: 'short' })}
        </div>
        <div className="text-2xl font-bold text-gray-900 leading-none">
          {dateObj.getDate()}
        </div>
        <div className="text-xs text-gray-400">
          {dateObj.toLocaleDateString('es', { weekday: 'short' })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded ${cfg.color} flex items-center gap-1`}>
            <span className="live-dot w-1.5 h-1.5 bg-white rounded-full inline-block" />
            {cfg.label}
          </span>
          {event.recurring && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Repeat size={11} />
              Recurrente
            </span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
        <p className="text-sm text-gray-500 mb-2">{event.description}</p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Clock size={12} />{event.time} · {event.duration}</span>
          <span>{formatted}</span>
        </div>
        {event.meetingUrl && event.meetingUrl !== 'REEMPLAZA_CON_LINK_DE_ZOOM_O_MEET' && (
          <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">
            <ExternalLink size={13} />
            Unirse al evento
          </a>
        )}
        {(!event.meetingUrl || event.meetingUrl === 'REEMPLAZA_CON_LINK_DE_ZOOM_O_MEET') && (
          <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded inline-block">
            ⚠️ Reemplaza el link de reunión en content/events.json
          </p>
        )}
      </div>
    </div>
  )
}
