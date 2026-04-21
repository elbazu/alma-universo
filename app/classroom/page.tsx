'use client'

/**
 * app/classroom/page.tsx — Classroom index.
 *
 * Shows courses as a card grid with landscape thumbnails and progress bars.
 * Admin gets inline CRUD controls + "Edit lesson" modal.
 * No right sidebar (removed in Lesson Player sprint).
 * Clicking a card navigates to /classroom/[courseSlug].
 */

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  PlayCircle, Clock, Lock, ChevronDown, Plus, Pencil, Trash2,
  Loader2, Check, X, BookOpen, AlertCircle, Eye, EyeOff,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import LessonEditModal from '@/components/classroom/LessonEditModal'
import { getPb } from '@/lib/pocketbase'
import { isAdmin } from '@/lib/admin'
import {
  adminListCourses, listPublishedCourses,
  createCourse, updateCourse, deleteCourse,
  listModules, createModule, updateModule, deleteModule,
  listLessons, createLesson, deleteLesson,
  toSlug,
} from '@/lib/classroom-crud'
import type {
  CourseAdmin, ModuleRecord, LessonRecord,
  CourseFormData, ModuleFormData,
} from '@/lib/classroom-crud'
import { getCompletedLessonIds } from '@/lib/lesson-progress'

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-surface-secondary border border-border rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ' +
  'placeholder:text-body-muted text-body transition'

// ─── Progress bar ─────────────────────────────────────────────────────────────

function CourseProgressBar({ courseId, allLessonIds }: { courseId: string; allLessonIds: string[] }) {
  const [percent, setPercent] = useState<number | null>(null)

  useEffect(() => {
    if (allLessonIds.length === 0) { setPercent(0); return }
    getCompletedLessonIds(courseId).then(completed => {
      const done = allLessonIds.filter(id => completed.has(id)).length
      setPercent(Math.round((done / allLessonIds.length) * 100))
    })
  }, [courseId, allLessonIds])

  if (percent === null) return <div className="h-1.5 bg-gray-100 rounded-full animate-pulse" />

  return (
    <div className="space-y-1">
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-body-muted">{percent}% completado</p>
    </div>
  )
}

// ─── Inline text editor ──────────────────────────────────────────────────────

function InlineEdit({
  value, onSave, onCancel, placeholder = 'Título', className = '',
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
        autoFocus value={val} onChange={e => setVal(e.target.value)}
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

// ─── Lesson row (admin accordion) ────────────────────────────────────────────

function LessonRow({
  lesson, idx, admin, onUpdate, onDelete,
}: {
  lesson: LessonRecord
  idx: number
  admin: boolean
  onUpdate: (updated: LessonRecord) => void
  onDelete: (id: string) => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-surface-secondary group">
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-500">
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-body truncate">{lesson.title}</div>
          {lesson.description && (
            <div className="text-xs text-body-muted mt-0.5 truncate">{lesson.description}</div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {lesson.duration_minutes > 0 && (
            <span className="flex items-center gap-1 text-xs text-body-muted">
              <Clock size={11} />{lesson.duration_minutes}m
            </span>
          )}
          {lesson.is_free
            ? <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">Gratis</span>
            : <Lock size={13} className="text-gray-400" />
          }
          {!lesson.is_published && (
            <EyeOff size={13} className="text-amber-500" aria-label="No publicada" />
          )}
          {admin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => setEditing(true)}
                className="p-1 text-body-muted hover:text-brand-600"
                title="Editar lección"
              >
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

      {editing && (
        <LessonEditModal
          lesson={lesson}
          onSave={updated => { onUpdate(updated); setEditing(false) }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}

// ─── Module accordion ────────────────────────────────────────────────────────

function ModuleAccordion({
  mod, courseId, admin, onModuleUpdate, onModuleDelete,
}: {
  mod: ModuleRecord
  courseId: string
  admin: boolean
  onModuleUpdate: (id: string, data: Partial<ModuleFormData>) => Promise<void>
  onModuleDelete: (id: string) => Promise<void>
}) {
  const [open, setOpen]               = useState(false)
  const [lessons, setLessons]         = useState<LessonRecord[]>([])
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [addingLesson, setAddingLesson]     = useState(false)
  const [editingTitle, setEditingTitle]     = useState(false)

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

  return (
    <div className="border-t border-border">
      <div className="flex items-center gap-2 px-4 py-3 hover:bg-surface-secondary transition group">
        <button onClick={toggleOpen} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <ChevronDown size={15} className={`text-body-muted transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
          {editingTitle ? (
            <InlineEdit
              value={mod.title} placeholder="Nombre del módulo"
              onSave={async v => { await onModuleUpdate(mod.id, { title: v }); setEditingTitle(false) }}
              onCancel={() => setEditingTitle(false)}
              className="flex-1"
            />
          ) : (
            <span className="font-medium text-sm text-body truncate">{mod.title}</span>
          )}
          {!mod.is_published && (
            <EyeOff size={12} className="text-amber-500 flex-shrink-0" aria-label="No publicado" />
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

      {open && (
        <div className="pl-4">
          {loadingLessons ? (
            <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin text-brand-400" /></div>
          ) : (
            <>
              {lessons.map((lesson, idx) => (
                <LessonRow
                  key={lesson.id} lesson={lesson} idx={idx} admin={admin}
                  onUpdate={updated => setLessons(prev => prev.map(l => l.id === updated.id ? updated : l))}
                  onDelete={async id => {
                    const ok = await deleteLesson(id)
                    if (ok) setLessons(prev => prev.filter(l => l.id !== id))
                  }}
                />
              ))}
              {lessons.length === 0 && !addingLesson && (
                <p className="px-4 py-3 text-xs text-body-muted">Sin lecciones todavía.</p>
              )}
              {admin && (
                <div className="px-4 py-2">
                  {addingLesson ? (
                    <InlineEdit
                      value="" placeholder="Nombre de la lección"
                      onSave={handleAddLesson}
                      onCancel={() => setAddingLesson(false)}
                    />
                  ) : (
                    <button onClick={() => setAddingLesson(true)} className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition">
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
  course, admin, loggedIn, onUpdate, onDelete,
}: {
  course: CourseAdmin
  admin: boolean
  loggedIn: boolean
  onUpdate: (id: string, data: Partial<CourseFormData>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [open, setOpen]               = useState(false)
  const [modules, setModules]         = useState<ModuleRecord[]>([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [addingModule, setAddingModule]     = useState(false)
  const [deleting, setDeleting]             = useState(false)
  // Flat lesson IDs for progress bar — loaded once when card mounts
  const [lessonIds, setLessonIds] = useState<string[]>([])

  // Load lesson IDs for progress bar
  useEffect(() => {
    if (!loggedIn) return
    listModules(course.id).then(async mods => {
      const all = await Promise.all(mods.map(m => listLessons(m.id)))
      setLessonIds(all.flat().map(l => l.id))
    })
  }, [course.id, loggedIn])

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
      {/* Thumbnail */}
      <Link href={`/classroom/${course.slug}`} className="block relative">
        <div className="w-full aspect-video bg-gradient-to-br from-brand-100 to-brand-200 overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PlayCircle size={40} className="text-brand-400" />
            </div>
          )}
        </div>
        {!course.is_published && (
          <span className="absolute top-2 left-2 flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            <EyeOff size={10} /> Borrador
          </span>
        )}
        {course.access_type === 'free' && (
          <span className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            Gratis
          </span>
        )}
      </Link>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <Link href={`/classroom/${course.slug}`}>
              <h3 className="font-semibold text-gray-900 text-sm leading-snug hover:text-brand-600 transition line-clamp-2">
                {course.title}
              </h3>
            </Link>
            {course.tagline && (
              <p className="text-xs text-body-muted mt-0.5 line-clamp-1">{course.tagline}</p>
            )}
          </div>

          {/* Admin controls */}
          {admin && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={async () => onUpdate(course.id, { is_published: !course.is_published })}
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

        {/* Progress bar (logged-in users) */}
        {loggedIn && (
          <CourseProgressBar courseId={course.id} allLessonIds={lessonIds} />
        )}

        {/* Admin accordion toggle */}
        {admin && (
          <button
            onClick={toggleOpen}
            className="mt-3 flex items-center gap-1 text-xs text-body-muted hover:text-brand-600 transition"
          >
            <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            {open ? 'Ocultar módulos' : 'Ver / editar módulos'}
          </button>
        )}
      </div>

      {/* Admin modules accordion */}
      {admin && open && (
        <div className="border-t border-border">
          {loadingModules ? (
            <div className="py-4 flex justify-center border-t border-border">
              <Loader2 size={16} className="animate-spin text-brand-400" />
            </div>
          ) : (
            <>
              {modules.map(mod => (
                <ModuleAccordion
                  key={mod.id} mod={mod} courseId={course.id} admin={admin}
                  onModuleUpdate={handleModuleUpdate}
                  onModuleDelete={handleModuleDelete}
                />
              ))}
              {modules.length === 0 && !addingModule && (
                <div className="px-6 py-4 text-sm text-body-muted text-center">
                  Sin módulos todavía. Agrega el primero.
                </div>
              )}
              <div className="px-4 py-3 border-t border-border">
                {addingModule ? (
                  <InlineEdit
                    value="" placeholder="Nombre del módulo"
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
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── New course modal ────────────────────────────────────────────────────────

function NewCourseModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (course: CourseAdmin) => void
}) {
  const [title, setTitle]           = useState('')
  const [tagline, setTagline]       = useState('')
  const [accessType, setAccessType] = useState<'free' | 'paid'>('free')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    setError('')
    const course = await createCourse({
      title: title.trim(),
      tagline: tagline.trim() || undefined,
      access_type: accessType,
      is_published: false,
    })
    setSaving(false)
    if (!course) { setError('Error al crear el curso.'); return }
    onCreate(course)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit} onClick={e => e.stopPropagation()}
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
              autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Nutrición alineada a chakras" maxLength={120}
              className={INPUT_CLASS}
            />
            {title && <p className="text-xs text-body-muted mt-1">URL: /classroom/{toSlug(title)}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-body mb-1">Tagline (opcional)</label>
            <input
              value={tagline} onChange={e => setTagline(e.target.value)}
              placeholder="Una frase corta que lo describe" maxLength={180}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-body mb-1">Acceso</label>
            <div className="flex gap-3">
              {(['free', 'paid'] as const).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={type} checked={accessType === type}
                    onChange={() => setAccessType(type)} className="accent-brand-500" />
                  <span className="text-sm text-body">{type === 'free' ? '🆓 Gratis' : '💳 De pago'}</span>
                </label>
              ))}
            </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClassroomPage() {
  const [courses, setCourses]         = useState<CourseAdmin[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(false)
  const [showNewCourse, setShowNewCourse] = useState(false)

  const pb       = getPb()
  const user     = pb.authStore.record as { email?: string } | null
  const admin    = isAdmin(user)
  const loggedIn = Boolean(user)

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = admin ? await adminListCourses() : await listPublishedCourses()
      setCourses(data)
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
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen size={22} className="text-brand-500" />
              Classroom
            </h1>
            <p className="text-sm text-body-muted mt-0.5">
              {admin ? 'Administra tus cursos, módulos y lecciones.' : 'Tu espacio de aprendizaje.'}
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

        {/* Course grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand-400" />
          </div>
        ) : error ? (
          <div className="post-card p-8 text-center text-body-muted">
            <AlertCircle size={24} className="mx-auto mb-2 text-red-400" />
            <p className="text-sm">No se pudo cargar el classroom.</p>
            <button onClick={loadCourses} className="mt-3 text-xs text-brand-600 hover:underline">Reintentar</button>
          </div>
        ) : courses.length === 0 ? (
          <div className="post-card p-16 text-center">
            <div className="text-5xl mb-4">📚</div>
            <p className="font-medium text-body text-lg">
              {admin ? 'Todavía no hay cursos.' : 'Cursos disponibles muy pronto.'}
            </p>
            {admin && (
              <button
                onClick={() => setShowNewCourse(true)}
                className="mt-5 px-5 py-2.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition"
              >
                Crear el primero
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                admin={admin}
                loggedIn={loggedIn}
                onUpdate={handleUpdateCourse}
                onDelete={handleDeleteCourse}
              />
            ))}
          </div>
        )}
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
