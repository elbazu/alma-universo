'use client'

/**
 * app/classroom/page.tsx — Classroom with admin CRUD.
 *
 * Sprint 1: Alma (admin) can create/edit/delete courses, modules, and lessons.
 * Members see a published-only accordion view.
 * Public navigation (lesson player page) is Sprint 2+.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  PlayCircle, Clock, Lock, ChevronDown, Plus, Pencil, Trash2,
  Loader2, Check, X, BookOpen, AlertCircle, Eye, EyeOff,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import { getPb } from '@/lib/pocketbase'
import { isAdmin } from '@/lib/admin'
import {
  adminListCourses, createCourse, updateCourse, deleteCourse,
  listModules, createModule, updateModule, deleteModule,
  listLessons, createLesson, updateLesson, deleteLesson,
  toSlug,
} from '@/lib/classroom-crud'
import type {
  CourseAdmin, ModuleRecord, LessonRecord,
  CourseFormData, ModuleFormData, LessonFormData,
} from '@/lib/classroom-crud'

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-surface-secondary border border-border rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ' +
  'placeholder:text-body-muted text-body transition'

// ─── Inline text editor ──────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  onCancel,
  placeholder = 'Título',
  className = '',
}: {
  value: string
  onSave: (v: string) => Promise<void>
  onCancel: () => void
  placeholder?: string
  className?: string
}) {
  const [val, setVal] = useState(value)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!val.trim()) return
    setSaving(true)
    await onSave(val.trim())
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className={`flex items-center gap-2 ${className}`}>
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-2 py-1 text-sm border border-brand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-surface"
      />
      <button type="submit" disabled={saving || !val.trim()} className="p-1 text-green-600 hover:text-green-700 disabled:opacity-40">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
      </button>
      <button type="button" onClick={onCancel} className="p-1 text-body-muted hover:text-body">
        <X size={14} />
      </button>
    </form>
  )
}

// ─── Lesson row ──────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  idx,
  admin,
  onUpdate,
  onDelete,
}: {
  lesson: LessonRecord
  idx: number
  admin: boolean
  onUpdate: (id: string, data: Partial<LessonFormData>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <div className={`flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-surface-secondary group`}>
      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-500">
        {idx + 1}
      </div>
      <div className="flex-1 min-w-0">
        {editing ? (
          <InlineEdit
            value={lesson.title}
            placeholder="Título de la lección"
            onSave={async v => { await onUpdate(lesson.id, { title: v }); setEditing(false) }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <div className="font-medium text-body truncate">{lesson.title}</div>
            {lesson.description && (
              <div className="text-xs text-body-muted mt-0.5 truncate">{lesson.description}</div>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {lesson.duration_minutes > 0 && (
          <span className="flex items-center gap-1 text-xs text-body-muted">
            <Clock size={11} />{lesson.duration_minutes}m
          </span>
        )}
        {lesson.is_free ? (
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">Gratis</span>
        ) : (
          <Lock size={13} className="text-gray-400" />
        )}
        {!lesson.is_published && (
          <EyeOff size={13} className="text-amber-500" title="No publicada" />
        )}
        {admin && !editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => setEditing(true)} className="p-1 text-body-muted hover:text-brand-600">
              <Pencil size={12} />
            </button>
            <button
              disabled={deleting}
              onClick={async () => {
                if (!confirm('¿Eliminar esta lección?')) return
                setDeleting(true)
                await onDelete(lesson.id)
              }}
              className="p-1 text-body-muted hover:text-red-500 disabled:opacity-40"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Module accordion ────────────────────────────────────────────────────────

function ModuleAccordion({
  mod,
  courseId,
  admin,
  onModuleUpdate,
  onModuleDelete,
}: {
  mod: ModuleRecord
  courseId: string
  admin: boolean
  onModuleUpdate: (id: string, data: Partial<ModuleFormData>) => Promise<void>
  onModuleDelete: (id: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [lessons, setLessons] = useState<LessonRecord[]>([])
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [addingLesson, setAddingLesson] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)

  async function loadLessons() {
    setLoadingLessons(true)
    const data = await listLessons(mod.id)
    setLessons(data)
    setLoadingLessons(false)
  }

  function toggleOpen() {
    if (!open) loadLessons()
    setOpen(o => !o)
  }

  async function handleAddLesson(title: string) {
    const lesson = await createLesson(mod.id, { title }, lessons.length)
    if (lesson) setLessons(prev => [...prev, lesson])
    setAddingLesson(false)
  }

  async function handleUpdateLesson(id: string, data: Partial<LessonFormData>) {
    const updated = await updateLesson(id, data)
    if (updated) setLessons(prev => prev.map(l => l.id === id ? updated : l))
  }

  async function handleDeleteLesson(id: string) {
    const ok = await deleteLesson(id)
    if (ok) setLessons(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="border-t border-border">
      {/* Module header */}
      <div className="flex items-center gap-2 px-4 py-3 hover:bg-surface-secondary transition group">
        <button onClick={toggleOpen} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <ChevronDown size={15} className={`text-body-muted transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
          {editingTitle ? (
            <InlineEdit
              value={mod.title}
              placeholder="Nombre del módulo"
              onSave={async v => { await onModuleUpdate(mod.id, { title: v }); setEditingTitle(false) }}
              onCancel={() => setEditingTitle(false)}
              className="flex-1"
            />
          ) : (
            <span className="font-medium text-sm text-body truncate">{mod.title}</span>
          )}
          {!mod.is_published && (
            <EyeOff size={12} className="text-amber-500 flex-shrink-0" title="No publicado" />
          )}
        </button>
        {admin && !editingTitle && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
            <button onClick={() => setEditingTitle(true)} className="p-1 text-body-muted hover:text-brand-600">
              <Pencil size={12} />
            </button>
            <button
              onClick={async () => {
                if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return
                await onModuleDelete(mod.id)
              }}
              className="p-1 text-body-muted hover:text-red-500"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Lesson list */}
      {open && (
        <div className="pl-4">
          {loadingLessons ? (
            <div className="py-4 flex justify-center">
              <Loader2 size={16} className="animate-spin text-brand-400" />
            </div>
          ) : (
            <>
              {lessons.map((lesson, idx) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  idx={idx}
                  admin={admin}
                  onUpdate={handleUpdateLesson}
                  onDelete={handleDeleteLesson}
                />
              ))}
              {lessons.length === 0 && !addingLesson && (
                <p className="px-4 py-3 text-xs text-body-muted">Sin lecciones todavía.</p>
              )}
              {admin && (
                <div className="px-4 py-2">
                  {addingLesson ? (
                    <InlineEdit
                      value=""
                      placeholder="Nombre de la lección"
                      onSave={handleAddLesson}
                      onCancel={() => setAddingLesson(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setAddingLesson(true)}
                      className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition"
                    >
                      <Plus size={13} /> Agregar lección
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Course card ─────────────────────────────────────────────────────────────

function CourseCard({
  course,
  admin,
  onUpdate,
  onDelete,
}: {
  course: CourseAdmin
  admin: boolean
  onUpdate: (id: string, data: Partial<CourseFormData>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [addingModule, setAddingModule] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function loadModules() {
    setLoadingModules(true)
    const data = await listModules(course.id)
    setModules(data)
    setLoadingModules(false)
  }

  function toggleOpen() {
    if (!open) loadModules()
    setOpen(o => !o)
  }

  async function handleAddModule(title: string) {
    const mod = await createModule(course.id, { title }, modules.length)
    if (mod) setModules(prev => [...prev, mod])
    setAddingModule(false)
  }

  async function handleModuleUpdate(id: string, data: Partial<ModuleFormData>) {
    const updated = await updateModule(id, data)
    if (updated) setModules(prev => prev.map(m => m.id === id ? updated : m))
  }

  async function handleModuleDelete(id: string) {
    const ok = await deleteModule(id)
    if (ok) setModules(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="post-card overflow-hidden">
      {/* Course header */}
      <div className="flex items-center gap-4 p-4 group">
        <button onClick={toggleOpen} className="flex items-center gap-4 flex-1 text-left min-w-0">
          <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <PlayCircle size={22} className="text-brand-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{course.title}</h3>
              {!course.is_published && (
                <span className="flex-shrink-0 flex items-center gap-1 text-xs text-amber-600">
                  <EyeOff size={11} /> Borrador
                </span>
              )}
            </div>
            {course.tagline && (
              <p className="text-xs text-body-muted mt-0.5 truncate">{course.tagline}</p>
            )}
            <p className="text-xs text-body-muted mt-1">
              {course.access_type === 'free' ? '🆓 Gratis' : `💳 $${(course.price_cents / 100).toFixed(2)}`}
            </p>
          </div>
          <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Admin actions */}
        {admin && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={async () => {
                const newState = !course.is_published
                await onUpdate(course.id, { is_published: newState })
              }}
              title={course.is_published ? 'Despublicar' : 'Publicar'}
              className="p-1.5 text-body-muted hover:text-brand-600 rounded transition"
            >
              {course.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              disabled={deleting}
              onClick={async () => {
                if (!confirm(`¿Eliminar "${course.title}" y todo su contenido?`)) return
                setDeleting(true)
                await onDelete(course.id)
              }}
              className="p-1.5 text-body-muted hover:text-red-500 rounded transition disabled:opacity-40"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Modules */}
      {open && (
        <div>
          {loadingModules ? (
            <div className="py-4 flex justify-center border-t border-border">
              <Loader2 size={16} className="animate-spin text-brand-400" />
            </div>
          ) : (
            <>
              {modules.map(mod => (
                <ModuleAccordion
                  key={mod.id}
                  mod={mod}
                  courseId={course.id}
                  admin={admin}
                  onModuleUpdate={handleModuleUpdate}
                  onModuleDelete={handleModuleDelete}
                />
              ))}
              {modules.length === 0 && !addingModule && (
                <div className="border-t border-border px-6 py-4 text-sm text-body-muted text-center">
                  {admin ? 'Sin módulos todavía. Agrega el primero.' : 'Próximamente.'}
                </div>
              )}
              {admin && (
                <div className="border-t border-border px-4 py-3">
                  {addingModule ? (
                    <InlineEdit
                      value=""
                      placeholder="Nombre del módulo"
                      onSave={handleAddModule}
                      onCancel={() => setAddingModule(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setAddingModule(true)}
                      className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition"
                    >
                      <Plus size={14} /> Agregar módulo
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── New course modal ────────────────────────────────────────────────────────

function NewCourseModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (course: CourseAdmin) => void
}) {
  const [title, setTitle] = useState('')
  const [tagline, setTagline] = useState('')
  const [accessType, setAccessType] = useState<'free' | 'paid'>('free')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    setError('')
    const course = await createCourse({
      title: title.trim(),
      tagline: tagline.trim() || undefined,
      access_type: accessType,
      is_published: false, // start as draft
    })
    setSaving(false)
    if (!course) { setError('Error al crear el curso.'); return }
    onCreate(course)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Nuevo curso</h2>
          <button type="button" onClick={onClose} className="p-1 text-body-muted hover:text-body rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-body mb-1">Nombre del curso *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Nutrición alineada a chakras"
              maxLength={120}
              className={INPUT_CLASS}
            />
            {title && (
              <p className="text-xs text-body-muted mt-1">URL: /cursos/{toSlug(title)}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-body mb-1">Tagline (opcional)</label>
            <input
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="Una frase corta que lo describe"
              maxLength={180}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-body mb-1">Acceso</label>
            <div className="flex gap-3">
              {(['free', 'paid'] as const).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={type}
                    checked={accessType === type}
                    onChange={() => setAccessType(type)}
                    className="accent-brand-500"
                  />
                  <span className="text-sm text-body">{type === 'free' ? '🆓 Gratis' : '💳 De pago'}</span>
                </label>
              ))}
            </div>
            {accessType === 'paid' && (
              <p className="text-xs text-body-muted mt-1.5">
                El precio se configura en Sprint 3 (Precios). Por ahora se guarda como gratuito en beta.
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !title.trim()}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Crear curso
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ClassroomPage() {
  const [courses, setCourses] = useState<CourseAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showNewCourse, setShowNewCourse] = useState(false)

  const pb = getPb()
  const user = pb.authStore.record as { email?: string } | null
  const admin = isAdmin(user)

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await adminListCourses()
      // Non-admins see only published courses
      setCourses(admin ? data : data.filter(c => c.is_published))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [admin])

  useEffect(() => { loadCourses() }, [loadCourses])

  async function handleUpdateCourse(id: string, data: Partial<CourseFormData>) {
    const updated = await updateCourse(id, data)
    if (updated) setCourses(prev => prev.map(c => c.id === id ? updated : c))
  }

  async function handleDeleteCourse(id: string) {
    const ok = await deleteCourse(id)
    if (ok) setCourses(prev => prev.filter(c => c.id !== id))
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen size={22} className="text-brand-500" />
                  Classroom
                </h1>
                <p className="text-sm text-body-muted mt-0.5">
                  {admin
                    ? 'Administra tus cursos, módulos y lecciones.'
                    : 'Tu espacio de aprendizaje.'}
                </p>
              </div>
              {admin && (
                <button
                  onClick={() => setShowNewCourse(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition"
                >
                  <Plus size={15} /> Nuevo curso
                </button>
              )}
            </div>

            {/* Course list */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={24} className="animate-spin text-brand-400" />
              </div>
            ) : error ? (
              <div className="post-card p-8 text-center text-body-muted">
                <AlertCircle size={24} className="mx-auto mb-2 text-red-400" />
                <p className="text-sm">No se pudo cargar el classroom.</p>
                <button onClick={loadCourses} className="mt-3 text-xs text-brand-600 hover:underline">Reintentar</button>
              </div>
            ) : courses.length === 0 ? (
              <div className="post-card p-12 text-center">
                <div className="text-4xl mb-3">📚</div>
                <p className="font-medium text-body">
                  {admin ? 'Todavía no hay cursos.' : 'Cursos disponibles muy pronto.'}
                </p>
                {admin && (
                  <button
                    onClick={() => setShowNewCourse(true)}
                    className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition"
                  >
                    Crear el primero
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    admin={admin}
                    onUpdate={handleUpdateCourse}
                    onDelete={handleDeleteCourse}
                  />
                ))}
              </div>
            )}
          </div>

          <Sidebar />
        </div>
      </main>

      {showNewCourse && (
        <NewCourseModal
          onClose={() => setShowNewCourse(false)}
          onCreate={course => setCourses(prev => [...prev, course])}
        />
      )}
    </>
  )
}
