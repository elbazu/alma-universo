'use client'

/**
 * DownloadsPane — Sprint 10.
 *
 * Admin UI for managing downloadable resources.
 * Resources are stored in PocketBase `downloads` collection and
 * displayed on the /downloads page for logged-in members.
 */

import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Check, X, Download, FileText, Image } from 'lucide-react'
import {
  listAllDownloads, createDownload, updateDownload, deleteDownload,
  type DownloadRecord, type DownloadPayload,
} from '@/lib/downloads'
import { listPublishedCourses } from '@/lib/classroom-crud'

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-body-muted text-body transition'
const LABEL = 'block text-xs font-medium text-body-muted mb-1'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyPayload(): DownloadPayload {
  return {
    title: '', title_en: '',
    description: '', description_en: '',
    file: null, thumbnail: null,
    is_free: true, required_course: '',
    sort_order: 0, active: true,
  }
}

// ─── Resource form ────────────────────────────────────────────────────────────

interface CourseOption { id: string; title: string }

interface FormProps {
  initial?: DownloadRecord
  courses: CourseOption[]
  onSave:   (payload: DownloadPayload) => Promise<void>
  onCancel: () => void
}

function DownloadForm({ initial, courses, onSave, onCancel }: FormProps) {
  const [form, setForm] = useState<DownloadPayload>(
    initial
      ? {
          title:           initial.title,
          title_en:        initial.title_en,
          description:     initial.description,
          description_en:  initial.description_en,
          file:            null,
          thumbnail:       null,
          is_free:         initial.is_free,
          required_course: initial.required_course,
          sort_order:      initial.sort_order,
          active:          initial.active,
        }
      : emptyPayload()
  )
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const fileRef                 = useRef<HTMLInputElement>(null)
  const thumbRef                = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('El título en español es obligatorio.'); return }
    if (!initial && !form.file) { setError('Debes subir un archivo.'); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  function set(key: keyof DownloadPayload, val: unknown) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Título (Español) *</label>
          <input className={INPUT} value={form.title}
            onChange={e => set('title', e.target.value)} placeholder="Ej: Guía de Chakras" />
        </div>
        <div>
          <label className={LABEL}>Title (English)</label>
          <input className={INPUT} value={form.title_en}
            onChange={e => set('title_en', e.target.value)} placeholder="e.g. Chakra Guide" />
        </div>
      </div>

      {/* Description row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Descripción (Español)</label>
          <textarea className={INPUT} rows={3} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Breve descripción del recurso…" />
        </div>
        <div>
          <label className={LABEL}>Description (English)</label>
          <textarea className={INPUT} rows={3} value={form.description_en}
            onChange={e => set('description_en', e.target.value)}
            placeholder="Brief description of the resource…" />
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className={LABEL}>
          Archivo {!initial && <span className="text-red-400">*</span>}
          {initial?.file && <span className="text-brand-500 ml-1">(ya existe — sube uno nuevo para reemplazarlo)</span>}
        </label>
        <div
          className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 transition"
          onClick={() => fileRef.current?.click()}
        >
          <FileText size={20} className="mx-auto mb-1 text-body-muted" />
          <p className="text-xs text-body-muted">
            {form.file ? form.file.name : 'Haz clic para seleccionar un archivo (PDF, ZIP, MP3…)'}
          </p>
          <input ref={fileRef} type="file" className="hidden"
            onChange={e => set('file', e.target.files?.[0] ?? null)} />
        </div>
      </div>

      {/* Thumbnail */}
      <div>
        <label className={LABEL}>
          Miniatura (opcional)
          {initial?.thumbnail && <span className="text-brand-500 ml-1">(ya existe)</span>}
        </label>
        <div
          className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 transition"
          onClick={() => thumbRef.current?.click()}
        >
          <Image size={20} className="mx-auto mb-1 text-body-muted" />
          <p className="text-xs text-body-muted">
            {form.thumbnail ? form.thumbnail.name : 'Imagen de portada para la tarjeta (JPG, PNG)'}
          </p>
          <input ref={thumbRef} type="file" accept="image/*" className="hidden"
            onChange={e => set('thumbnail', e.target.files?.[0] ?? null)} />
        </div>
      </div>

      {/* Access settings */}
      <div className="p-4 bg-surface-secondary rounded-xl space-y-3">
        <h4 className="text-xs font-semibold text-body-muted uppercase tracking-wide">Acceso</h4>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set('is_free', !form.is_free)}
            className={`w-10 h-5 rounded-full transition flex items-center px-0.5 ${form.is_free ? 'bg-brand-500' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_free ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm text-body">
            Recurso gratuito (visible para todos los miembros)
          </span>
        </label>

        {!form.is_free && (
          <div>
            <label className={LABEL}>Requiere inscripción en curso (opcional)</label>
            <select className={INPUT} value={form.required_course}
              onChange={e => set('required_course', e.target.value)}>
              <option value="">Sin requisito</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Sort order */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Orden de aparición</label>
          <input type="number" min={0} className={INPUT} value={form.sort_order}
            onChange={e => set('sort_order', Number(e.target.value))} />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('active', !form.active)}
              className={`w-10 h-5 rounded-full transition flex items-center px-0.5 ${form.active ? 'bg-brand-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-body">Visible (activo)</span>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-border text-body hover:bg-surface-secondary transition">
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {saving ? 'Guardando…' : 'Guardar recurso'}
        </button>
      </div>
    </form>
  )
}

// ─── Resource row ─────────────────────────────────────────────────────────────

function DownloadRow({
  item, onEdit, onDelete,
}: {
  item: DownloadRecord
  onEdit:   () => void
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl">
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center flex-shrink-0">
        {item.thumbnail_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.thumbnail_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
          : <Download size={16} className="text-brand-500" />
        }
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-body truncate">{item.title}</span>
          {item.title_en && <span className="text-xs text-body-muted">/ {item.title_en}</span>}
          {item.is_free
            ? <span className="text-xs bg-green-50 text-green-700 px-1.5 rounded">Gratis</span>
            : <span className="text-xs bg-amber-50 text-amber-700 px-1.5 rounded">🔒 {item.required_course_name || 'Req. curso'}</span>
          }
          {!item.active && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 rounded">Inactivo</span>}
        </div>
        {item.description && (
          <p className="text-xs text-body-muted truncate mt-0.5">{item.description}</p>
        )}
      </div>
      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {confirming ? (
          <>
            <button onClick={onDelete}
              className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded transition">
              Eliminar
            </button>
            <button onClick={() => setConfirming(false)}
              className="text-xs text-body-muted hover:text-body px-2 py-1 rounded transition">
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-body-muted hover:text-body transition">
              <Pencil size={14} />
            </button>
            <button onClick={() => setConfirming(true)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-body-muted hover:text-red-500 transition">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main pane ────────────────────────────────────────────────────────────────

export default function DownloadsPane() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([])
  const [courses,   setCourses]   = useState<CourseOption[]>([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState<DownloadRecord | null | 'new'>(null)

  useEffect(() => {
    Promise.all([listAllDownloads(), listPublishedCourses()])
      .then(([dl, cs]) => {
        setDownloads(dl)
        setCourses(cs.map(c => ({ id: c.id, title: c.title })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave(payload: DownloadPayload) {
    if (editing === 'new') {
      const created = await createDownload(payload)
      if (created) setDownloads(prev => [...prev, created])
    } else if (editing) {
      const updated = await updateDownload(editing.id, payload)
      if (updated) setDownloads(prev => prev.map(d => d.id === updated.id ? updated : d))
    }
    setEditing(null)
  }

  async function handleDelete(id: string) {
    const ok = await deleteDownload(id)
    if (ok) setDownloads(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-body">Recursos Descargables</h2>
          <p className="text-sm text-body-muted mt-0.5">
            Añade PDFs, guías y materiales para tus miembros.
          </p>
        </div>
        {editing === null && (
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition"
          >
            <Plus size={14} /> Nuevo recurso
          </button>
        )}
      </div>

      {/* Form */}
      {editing !== null && (
        <div className="p-5 bg-surface-secondary border border-border rounded-2xl">
          <h3 className="text-sm font-semibold text-body mb-4">
            {editing === 'new' ? 'Nuevo recurso' : 'Editar recurso'}
          </h3>
          <DownloadForm
            initial={editing === 'new' ? undefined : editing}
            courses={courses}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-brand-400" />
        </div>
      ) : downloads.length === 0 && editing === null ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <Download size={28} className="mx-auto mb-3 text-body-muted opacity-40" />
          <p className="text-sm text-body-muted">Aún no hay recursos. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {downloads.map(item => (
            <DownloadRow
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
