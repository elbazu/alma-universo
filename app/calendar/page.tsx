'use client'

/**
 * Calendar page — Sprint 7
 *
 * Two views toggled by icons in the header:
 *   • Lista  — original card-based list (LayoutList icon)
 *   • Mes    — month grid with Today button, prev/next nav, event pills
 *
 * Data: reads from PocketBase `events` collection; falls back to
 * content/events.json when PB is unreachable or collection missing.
 */

import { useState, useMemo, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'
import eventsData from '@/content/events.json'
import { fetchEvents, type CommunityEvent } from '@/lib/events'
import {
  Video, Calendar, Clock, Repeat, ExternalLink,
  LayoutList, CalendarDays, ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { Event } from '@/lib/types'

// Map CommunityEvent (PB) → Event (legacy JSON shape) for unified rendering
function pbToEvent(e: CommunityEvent): Event {
  return {
    id:           e.id ?? e.title,
    title:        e.title,
    description:  e.description,
    date:         e.date,
    time:         e.time,
    timezone:     e.timezone,
    duration:     e.duration,
    type:         e.type,
    meetingUrl:   e.meeting_url,
    recurring:    e.recurring,
    recurringDay: e.recurring_day,
  }
}

// ─── Shared config ─────────────────────────────────────────────────────────────

const typeConfig: Record<string, { label: string; color: string; pill: string; icon: typeof Video }> = {
  live:       { label: 'EN VIVO',    color: 'bg-red-500',    pill: 'bg-red-100 text-red-700',     icon: Video },
  meditation: { label: 'MEDITACIÓN', color: 'bg-purple-500', pill: 'bg-purple-100 text-purple-700', icon: Calendar },
  workshop:   { label: 'TALLER',     color: 'bg-blue-500',   pill: 'bg-blue-100 text-blue-700',    icon: Calendar },
}

// ─── List view ────────────────────────────────────────────────────────────────

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
            <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
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

// ─── Month grid view ──────────────────────────────────────────────────────────

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface DayCell {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: Event[]
}

function buildMonthGrid(year: number, month: number, events: Event[]): DayCell[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // First day of the month (0=Sun … 6=Sat)
  const firstDay = new Date(year, month, 1)
  // Adjust to Mon=0 grid: Sunday becomes 6, Mon=0 …
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)

  // Build full 6-week grid (42 cells) starting from Mon before firstDay
  const cells: DayCell[] = []
  const cursor = new Date(firstDay)
  cursor.setDate(cursor.getDate() - startOffset)

  for (let i = 0; i < 42; i++) {
    const d = new Date(cursor)
    d.setHours(0, 0, 0, 0)
    const dayStr = d.toISOString().slice(0, 10)
    cells.push({
      date: d,
      isCurrentMonth: d.getMonth() === month,
      isToday: d.getTime() === today.getTime(),
      events: events.filter(e => e.date === dayStr),
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  // Trim trailing empty weeks
  while (cells.length > 35 && cells.slice(-7).every(c => !c.isCurrentMonth)) {
    cells.splice(-7)
  }

  return cells
}

function MonthGrid({ events }: { events: Event[] }) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const cells = useMemo(() => buildMonthGrid(year, month, events), [year, month, events])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={goToday}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-body hover:border-brand-400 hover:text-brand-600 transition"
        >
          Hoy
        </button>
        <button onClick={prevMonth} className="p-1.5 rounded-lg border border-border text-body hover:border-brand-400 hover:text-brand-600 transition">
          <ChevronLeft size={15} />
        </button>
        <button onClick={nextMonth} className="p-1.5 rounded-lg border border-border text-body hover:border-brand-400 hover:text-brand-600 transition">
          <ChevronRight size={15} />
        </button>
        <span className="text-sm font-semibold text-body ml-1">
          {MONTH_NAMES[month]} {year}
        </span>
      </div>

      {/* Grid */}
      <div className="rounded-2xl border border-border overflow-hidden bg-surface">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEK_DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-body-muted uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const isLastRow = i >= cells.length - 7
            const isLastCol = (i + 1) % 7 === 0

            return (
              <div
                key={i}
                className={[
                  'min-h-[90px] p-1.5 relative',
                  !isLastRow ? 'border-b border-border' : '',
                  !isLastCol ? 'border-r border-border' : '',
                  !cell.isCurrentMonth ? 'bg-gray-50/50' : '',
                ].join(' ')}
              >
                {/* Day number */}
                <span className={[
                  'inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1',
                  cell.isToday
                    ? 'bg-brand-500 text-white'
                    : cell.isCurrentMonth
                      ? 'text-body'
                      : 'text-body-muted',
                ].join(' ')}>
                  {cell.date.getDate()}
                </span>

                {/* Event pills */}
                <div className="space-y-0.5">
                  {cell.events.slice(0, 3).map(ev => {
                    const cfg = typeConfig[ev.type] || typeConfig.live
                    return (
                      <div
                        key={ev.id}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate leading-tight ${cfg.pill}`}
                        title={ev.title}
                      >
                        {ev.time} {ev.title}
                      </div>
                    )
                  })}
                  {cell.events.length > 3 && (
                    <div className="text-[10px] text-body-muted pl-1">
                      +{cell.events.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'grid'

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>(eventsData as Event[])
  const [view, setView] = useState<ViewMode>('list')
  const { t } = useLanguage()

  // Load from PB on mount; fall back to JSON if PB unavailable
  useEffect(() => {
    fetchEvents().then(pbEvents => {
      if (pbEvents.length > 0) setEvents(pbEvents.map(pbToEvent))
    })
  }, [])

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header with view toggle */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-light mb-1" style={{ color: '#2C1F0E' }}>{t('calendar_title')}</h1>
            <p className="text-sm" style={{ color: '#6B4F35' }}>{t('calendar_subtitle')}</p>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl mt-1">
            <button
              onClick={() => setView('list')}
              title={t('calendar_view_list')}
              className={`p-2 rounded-lg transition ${
                view === 'list'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-body-muted hover:text-body'
              }`}
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setView('grid')}
              title={t('calendar_view_month')}
              className={`p-2 rounded-lg transition ${
                view === 'grid'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-body-muted hover:text-body'
              }`}
            >
              <CalendarDays size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        {view === 'list' ? (
          events.length > 0 ? (
            <div className="space-y-3">
              {events.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🗓️</div>
              <p className="font-medium">{t('calendar_empty')}</p>
              <p className="text-sm mt-1">{t('calendar_empty_sub')}</p>
            </div>
          )
        ) : (
          <MonthGrid events={events} />
        )}
      </div>
    </AppShell>
  )
}
