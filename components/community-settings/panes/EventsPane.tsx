'use client'

/**
 * EventsPane — Sprint 7.
 *
 * Admin UI for creating, editing, and deleting community events.
 * Events are stored in the PocketBase `events` collection and
 * displayed on the /calendar page.
 */

import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, Loader2, Check, X, Video, Calendar,
  ExternalLink, Repeat, ChevronDown,
} from 'lucide-react'
import {
  fetchEvents, createEvent, updateEvent, deleteEvent,
  type CommunityEvent,
} from '@/lib/events'

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: CommunityEvent['type']; label: string; color: string }[] = [
  { value: 'live',       label: 'EN VIVO',    color: 'bg-red-500' },
  { value: 'meditation', label: 'MEDITACIÓN', color: 'bg-purple-500' },
  { value: 'workshop',   label: 'TALLER',     color: 'bg-blue-500' },
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'Europe/Madrid',
  'UTC',
]

const INPUT = 'w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-body-muted text-body transition'

// ─── Empty event ──────────────────────────────────────────────────────────────

function emptyEvent(): Omit<CommunityEvent, 'id' | 'created' | 'updated'> {
  const today = new Date().toISOString().slice(0, 10)
  return {
    title:         '',
    description:   '',
    date:          today,
    time:          '10:00',
    timezone:      'America/New_York',
    duration:      '60 min',
    type:          'live',
    meeting_url:   '',
    recurring:     false,
    recurring_day: '',
  }
}

// ─── Event form modal ─────────────────────────────────────────────────────────

interface EventFormProps {
  initial?: CommunityEvent
  onSave: (data: Omit<CommunityEvent, 'id' | 'created' | 'updated'>) => Promise<void>
  onCancel: () => void
}

function EventForm({ initial, onSave, onCancel }: EventFormProps) {
  const [form, setForm] = useState<Omit<CommunityEvent, 'id' | 'created' | 'updated'>>(
    initial
      ? {
          title:         initial.title,
          description:   initial.description,
          date:          initial.date,
          time:          initial.time,
          timezone:      initial.timezone,
          duration:      initial.duration,
          type:          initial.type,
          meeting_url:   initial.meeting_url,
          recurring:     initial.recurring,
          recurring_day: initial.recurring_day ?? '',
        }
      : emptyEvent()
  )
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('El título es obligatorio.'); return }
    if (!form.date)          { setError('La fecha es obligatoria.');   return }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
    } catch {
      setError('Error al guardar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-body">
            {initial ? 'Editar evento' : 'Nuevo evento'}
          </h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-body-muted hover:text-body hover:bg-surface-secondary transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-body mb-1">Título *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ej: Meditación Grupal Semanal"
              className={INPUT}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-body mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              placeholder="Breve descripción del evento…"
              className={INPUT + ' resize-none'}
            />
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-body mb-1">Fecha *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-body mb-1">Hora</label>
              <input
                type="time"
                value={form.time}
                onChange={e => set('time', e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          {/* Duration + Timezone row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-body mb-1">Duración</label>
              <input
                value={form.duration}
                onChange={e => set('duration', e.target.value)}
                placeholder="Ej: 60 min"
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-body mb-1">Zona horaria</label>
              <div className="relative">
                <select
                  value={form.timezone}
                  onChange={e => set('timezone', e.target.value)}
                  className={INPUT + ' appearance-none pr-8'}
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz.replace('America/', '').replace('Europe/', '')}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-body-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-body mb-2">Tipo de evento</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('type', opt.value)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                    form.type === opt.value
                      ? `${opt.color} text-white border-transparent`
                      : 'border-border text-body-muted hover:text-body'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meeting URL */}
          <div>
            <label className="block text-xs font-medium text-body mb-1">
              Link de reunión <span className="text-body-muted font-normal">(Zoom, Meet…)</span>
            </label>
            <input
              type="url"
              value={form.meeting_url}
              onChange={e => set('meeting_url', e.target.value)}
              placeholder="https://zoom.us/j/..."
              className={INPUT}
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-body">Evento recurrente</p>
              <p className="text-xs text-body-muted">Se repite semanalmente</p>
            </div>
            <button
              type="button"
              onClick={() => set('recurring', !form.recurring)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.recurring ? 'bg-brand-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.recurring ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 text-sm border border-border rounded-lg text-body-muted hover:text-body transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Event row ────────────────────────────────────────────────────────────────

function EventRow({
  event,
  onEdit,
  onDelete,
}: {
  event: CommunityEvent
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const typeCfg = TYPE_OPTIONS.find(t => t.value === event.type) || TYPE_OPTIONS[0]
  const dateObj = new Date(`${event.date}T${event.time}`)

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-surface-secondary/50 transition group">
      {/* Date block */}
      <div className="w-12 flex-shrink-0 text-center">
        <div className="text-[10px] font-semibold text-brand-500 uppercase">
          {dateObj.toLocaleDateString('es', { month: 'short' })}
        </div>
        <div className="text-xl font-bold text-body leading-tight">
          {dateObj.getDate()}
        </div>
        <div className="text-[10px] text-body-muted">
          {event.time}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${typeCfg.color}`}>
            {typeCfg.label}
          </span>
          {event.recurring && (
            <span className="flex items-center gap-0.5 text-[10px] text-body-muted">
              <Repeat size={10} /> Recurrente
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-body truncate">{event.title}</p>
        {event.description && (
          <p className="text-xs text-body-muted truncate mt-0.5">{event.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1 text-[11px] text-body-muted">
          <span>{event.duration}</span>
          {event.meeting_url && (
            <a
              href={event.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-brand-500 hover:text-brand-700 transition"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={10} /> Link
            </a>
          )}
          {!event.meeting_url && (
            <span className="text-amber-500">⚠ Sin link</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-red-600 font-medium">¿Eliminar?</span>
            <button onClick={onDelete} className="p-1 rounded text-red-600 hover:bg-red-50 transition">
              <Check size={13} />
            </button>
            <button onClick={() => setConfirmDelete(false)} className="p-1 rounded text-body-muted hover:bg-surface transition">
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-body-muted hover:text-brand-600 hover:bg-brand-50 transition"
              title="Editar"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-body-muted hover:text-red-600 hover:bg-red-50 transition"
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Events pane ──────────────────────────────────────────────────────────────

export default function EventsPane() {
  const [events,   setEvents]   = useState<CommunityEvent[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<CommunityEvent | null>(null)

  async function load() {
    setLoading(true)
    const list = await fetchEvents()
    setEvents(list)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(data: Omit<CommunityEvent, 'id' | 'created' | 'updated'>) {
    if (editing?.id) {
      await updateEvent(editing.id, data)
    } else {
      await createEvent(data)
    }
    setShowForm(false)
    setEditing(null)
    await load()
  }

  async function handleDelete(id: string) {
    await deleteEvent(id)
    await load()
  }

  function openCreate() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(event: CommunityEvent) {
    setEditing(event)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-body-muted">
          Crea y gestiona los eventos que aparecen en el Calendario.
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition flex-shrink-0"
        >
          <Plus size={14} /> Nuevo evento
        </button>
      </div>

      {/* Event list */}
      <div className="border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-brand-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-body">Sin eventos todavía</p>
            <p className="text-xs text-body-muted">Crea tu primer evento con el botón de arriba.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map(ev => (
              <EventRow
                key={ev.id}
                event={ev}
                onEdit={() => openEdit(ev)}
                onDelete={() => ev.id && handleDelete(ev.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* PB schema reminder — shown only when list is empty */}
      {!loading && events.length === 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Video size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Paso previo:</span> crea la colección{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">events</code> en PocketBase
            con los campos indicados en el roadmap. Los eventos que crees aquí aparecerán
            automáticamente en el Calendario.
          </p>
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <EventForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
