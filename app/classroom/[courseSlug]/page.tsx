'use client'

/**
 * app/classroom/[courseSlug]/page.tsx — Lesson Player.
 *
 * Two-panel layout:
 *   Left  — course progress bar, module sections, clickable lesson list,
 *            checkmarks on completed lessons, gold highlight on active.
 *            Admin: "..." menu on each lesson row (Add page / Add folder).
 *   Right — lesson content view OR inline TipTap editor (admin only).
 *
 * "Marcar como hecha" is icon-only (circle/check, no text label).
 * Last-visited lesson is persisted in localStorage.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronLeft, CheckCircle2, Circle,
  ExternalLink, Loader2, Lock, PlayCircle, MoreHorizontal,
  Pencil, Plus, FolderPlus,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LessonEditor from '@/components/classroom/LessonEditor'
import { getPb } from '@/lib/pocketbase'
import { isAdmin } from '@/lib/admin'
import {
  getCourseBySlug, listModules, listLessons,
  createLesson, createModule,
} from '@/lib/classroom-crud'
import type { CourseAdmin, ModuleRecord, LessonRecord } from '@/lib/classroom-crud'
import {
  getAllCompletedLessonIds,
  markLessonComplete,
  markLessonIncomplete,
  saveLastLesson,
  loadLastLesson,
} from '@/lib/lesson-progress'

// ─── YouTube / Vimeo embed URL ────────────────────────────────────────────────

function toEmbedUrl(url: string): string | null {
  if (!url) return null
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
  )
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
  const vmMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
  return null
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-brand-600">{percent}%</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// ─── Left nav: module section ─────────────────────────────────────────────────

function NavModule({
  mod,
  lessons,
  activeLessonId,
  completedIds,
  admin,
  onSelect,
  onAddLesson,
  onAddModule,
}: {
  mod: ModuleRecord
  lessons: LessonRecord[]
  activeLessonId: string | null
  completedIds: Set<string>
  admin: boolean
  onSelect: (lesson: LessonRecord) => void
  onAddLesson: (moduleId: string) => void
  onAddModule: () => void
}) {
  const [open, setOpen] = useState(
    lessons.some(l => l.id === activeLessonId) || lessons.length > 0
  )

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface-secondary transition rounded-lg"
      >
        <span className="text-xs font-semibold text-body uppercase tracking-wide truncate pr-2">
          {mod.title}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-body-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-0.5 mt-0.5">
          {lessons.map((lesson, idx) => (
            <NavLessonRow
              key={lesson.id}
              lesson={lesson}
              idx={idx}
              isActive={lesson.id === activeLessonId}
              isCompleted={completedIds.has(lesson.id)}
              admin={admin}
              onSelect={onSelect}
              onAddLesson={() => onAddLesson(mod.id)}
              onAddModule={onAddModule}
            />
          ))}
          {/* Add page shortcut for admin */}
          {admin && (
            <button
              onClick={() => onAddLesson(mod.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-lg text-xs text-body-muted hover:text-brand-600 hover:bg-surface-secondary transition"
            >
              <Plus size={12} /> Nueva lección
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Single lesson row in left nav ────────────────────────────────────────────

function NavLessonRow({
  lesson, idx, isActive, isCompleted, admin,
  onSelect, onAddLesson, onAddModule,
}: {
  lesson: LessonRecord
  idx: number
  isActive: boolean
  isCompleted: boolean
  admin: boolean
  onSelect: (lesson: LessonRecord) => void
  onAddLesson: () => void
  onAddModule: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className="relative group/row flex items-center">
      <button
        onClick={() => onSelect(lesson)}
        className={`flex-1 flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm transition ${
          isActive
            ? 'bg-brand-50 text-brand-700 font-medium'
            : 'text-body hover:bg-surface-secondary'
        }`}
      >
        {/* Status icon */}
        <span className="flex-shrink-0">
          {isCompleted ? (
            <CheckCircle2 size={15} className="text-green-500" />
          ) : (
            <span className="w-[15px] h-[15px] flex items-center justify-center text-xs text-body-muted font-medium">
              {idx + 1}
            </span>
          )}
        </span>
        <span className="truncate leading-tight">{lesson.title}</span>
        {!lesson.is_free && !lesson.is_published && (
          <Lock size={10} className="flex-shrink-0 text-body-muted ml-auto" />
        )}
      </button>

      {/* Admin "..." button */}
      {admin && (
        <div ref={menuRef} className="flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
            className={`p-1 rounded text-body-muted hover:text-body hover:bg-surface-secondary transition opacity-0 group-hover/row:opacity-100 ${
              menuOpen ? 'opacity-100' : ''
            }`}
            aria-label="Opciones"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-0.5 w-44 bg-surface rounded-xl shadow-lg border border-border py-1 z-50">
              <button
                onClick={() => { onAddLesson(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-body hover:bg-surface-secondary transition"
              >
                <Plus size={13} className="text-body-muted" />
                Añadir página
              </button>
              <button
                onClick={() => { onAddModule(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-body hover:bg-surface-secondary transition"
              >
                <FolderPlus size={13} className="text-body-muted" />
                Añadir carpeta
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Lesson content panel (view mode) ────────────────────────────────────────

function LessonContent({
  lesson,
  isCompleted,
  loggedIn,
  admin,
  onMarkDone,
  onEditStart,
}: {
  lesson: LessonRecord
  isCompleted: boolean
  loggedIn: boolean
  admin: boolean
  onMarkDone: () => Promise<void>
  onEditStart: () => void
}) {
  const [marking, setMarking] = useState(false)
  const embedUrl = toEmbedUrl(lesson.video_url)

  async function handleMark() {
    setMarking(true)
    await onMarkDone()
    setMarking(false)
  }

  // Detect if description is HTML (TipTap output) or plain text (legacy)
  const isHtml = lesson.description?.trimStart().startsWith('<')

  return (
    <div className="flex flex-col h-full">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <h1 className="font-display text-xl font-semibold text-gray-900 leading-snug">
          {lesson.title}
        </h1>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Icon-only mark done button */}
          {loggedIn && (
            <button
              onClick={handleMark}
              disabled={marking}
              title={isCompleted ? 'Marcar como no hecha' : 'Marcar como hecha'}
              className={`flex items-center justify-center w-8 h-8 rounded-lg border transition ${
                isCompleted
                  ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                  : 'bg-surface border-border text-body-muted hover:border-brand-400 hover:text-brand-600'
              }`}
            >
              {marking ? (
                <Loader2 size={15} className="animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 size={15} />
              ) : (
                <Circle size={15} />
              )}
            </button>
          )}
          {/* Admin edit button */}
          {admin && (
            <button
              onClick={onEditStart}
              title="Editar lección"
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-body-muted hover:border-brand-400 hover:text-brand-600 hover:bg-surface transition"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Media — video takes priority over header image */}
      {embedUrl ? (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-5 flex-shrink-0">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={lesson.title}
          />
        </div>
      ) : lesson.content_image_url ? (
        <div className="w-full rounded-xl overflow-hidden mb-5 flex-shrink-0">
          <img
            src={lesson.content_image_url}
            alt={lesson.title}
            className="w-full object-cover max-h-[420px]"
          />
        </div>
      ) : null}

      {/* Description — rich HTML or legacy plain text */}
      {lesson.description && (
        isHtml ? (
          <div
            className="lesson-content-html leading-relaxed mb-4"
            dangerouslySetInnerHTML={{ __html: lesson.description }}
          />
        ) : (
          <div className="prose prose-sm max-w-none text-body leading-relaxed mb-4 whitespace-pre-wrap">
            {lesson.description}
          </div>
        )
      )}

      {/* External link */}
      {lesson.content_url && (
        <a
          href={lesson.content_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 hover:underline transition mt-2"
        >
          <ExternalLink size={13} />
          {lesson.content_url}
        </a>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LessonPlayerPage() {
  const params    = useParams()
  const router    = useRouter()
  const courseSlug = params.courseSlug as string

  const pb        = getPb()
  const loggedIn  = Boolean(pb.authStore.record)
  const admin     = isAdmin(pb.authStore.record as { email?: string } | null)

  // Data
  const [course,  setCourse]  = useState<CourseAdmin | null>(null)
  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, LessonRecord[]>>({})
  const [allLessons, setAllLessons] = useState<LessonRecord[]>([])

  // Active lesson & edit mode
  const [activeLesson, setActiveLesson] = useState<LessonRecord | null>(null)
  const [editMode, setEditMode]         = useState(false)

  // Progress
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  // ── Load everything on mount ────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    const c = await getCourseBySlug(courseSlug)
    if (!c) { setNotFound(true); setLoading(false); return }
    setCourse(c)

    const mods = await listModules(c.id)
    const visibleMods = admin ? mods : mods.filter(m => m.is_published)
    setModules(visibleMods)

    const entries = await Promise.all(
      visibleMods.map(async mod => {
        const lessons = await listLessons(mod.id)
        const visible = admin ? lessons : lessons.filter(l => l.is_published)
        return [mod.id, visible] as [string, LessonRecord[]]
      })
    )
    const byModule: Record<string, LessonRecord[]> = Object.fromEntries(entries)
    setLessonsByModule(byModule)

    const flat = visibleMods.flatMap(m => byModule[m.id] || [])
    setAllLessons(flat)

    const completed = await getAllCompletedLessonIds()
    setCompletedIds(completed)

    const lastId = loadLastLesson(c.id)
    const found  = lastId ? flat.find(l => l.id === lastId) ?? null : null
    const start  = found ?? flat[0] ?? null
    setActiveLesson(start)

    setLoading(false)
  }, [courseSlug, admin])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Navigate to a lesson ────────────────────────────────────────────────
  const rightPanelRef = useRef<HTMLDivElement>(null)

  function selectLesson(lesson: LessonRecord) {
    setActiveLesson(lesson)
    setEditMode(false)
    if (course) saveLastLesson(course.id, lesson.id)
    rightPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Mark done / undo ─────────────────────────────────────────────────────
  async function handleMarkDone() {
    if (!activeLesson) return
    const alreadyDone = completedIds.has(activeLesson.id)
    if (alreadyDone) {
      await markLessonIncomplete(activeLesson.id)
      setCompletedIds(prev => { const n = new Set(prev); n.delete(activeLesson.id); return n })
    } else {
      await markLessonComplete(activeLesson.id)
      setCompletedIds(prev => { const n = new Set(Array.from(prev)); n.add(activeLesson.id); return n })
    }
  }

  // ── After save from inline editor ────────────────────────────────────────
  function handleEditorSave(updated: LessonRecord) {
    setActiveLesson(updated)
    // Update the lesson in the byModule map
    setLessonsByModule(prev => {
      const next = { ...prev }
      for (const modId of Object.keys(next)) {
        next[modId] = next[modId].map(l => l.id === updated.id ? updated : l)
      }
      return next
    })
    setAllLessons(prev => prev.map(l => l.id === updated.id ? updated : l))
    setEditMode(false)
  }

  // ── Add lesson (from left nav "...") ─────────────────────────────────────
  async function handleAddLesson(moduleId: string) {
    const title = prompt('Nombre de la nueva lección:')
    if (!title?.trim()) return
    const existing = lessonsByModule[moduleId] || []
    const lesson = await createLesson(moduleId, { title: title.trim(), is_published: false }, existing.length)
    if (!lesson) return
    setLessonsByModule(prev => ({
      ...prev,
      [moduleId]: [...(prev[moduleId] || []), lesson],
    }))
    setAllLessons(prev => [...prev, lesson])
    // Auto-select and open for editing
    setActiveLesson(lesson)
    setEditMode(true)
    if (course) saveLastLesson(course.id, lesson.id)
  }

  // ── Add module (from left nav "...") ─────────────────────────────────────
  async function handleAddModule() {
    if (!course) return
    const title = prompt('Nombre del nuevo módulo:')
    if (!title?.trim()) return
    const mod = await createModule(course.id, { title: title.trim(), is_published: false }, modules.length)
    if (!mod) return
    setModules(prev => [...prev, mod])
    setLessonsByModule(prev => ({ ...prev, [mod.id]: [] }))
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  const progressPercent = allLessons.length === 0
    ? 0
    : Math.round((allLessons.filter(l => completedIds.has(l.id)).length / allLessons.length) * 100)

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
      </AppShell>
    )
  }

  if (notFound || !course) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-3">
          <p className="text-lg font-semibold text-body">Curso no encontrado</p>
          <button onClick={() => router.push('/classroom')} className="text-sm text-brand-600 hover:underline">
            ← Volver al Classroom
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex h-screen overflow-hidden">

        {/* ── Left nav panel ───────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 border-r border-border bg-surface flex flex-col overflow-hidden">
          {/* Course header */}
          <div className="p-4 border-b border-border space-y-3 flex-shrink-0">
            <button
              onClick={() => router.push('/classroom')}
              className="flex items-center gap-1.5 text-xs text-body-muted hover:text-brand-600 transition"
            >
              <ChevronLeft size={13} /> Todos los cursos
            </button>
            <div className="flex items-start gap-2.5">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <PlayCircle size={18} className="text-brand-500" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-body leading-tight line-clamp-2">
                  {course.title}
                </h2>
                {course.tagline && (
                  <p className="text-xs text-body-muted mt-0.5 line-clamp-1">{course.tagline}</p>
                )}
              </div>
            </div>
            {loggedIn && <ProgressBar percent={progressPercent} />}
          </div>

          {/* Module / lesson tree */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {modules.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-xs text-body-muted px-3">Sin módulos todavía.</p>
                {admin && (
                  <button
                    onClick={handleAddModule}
                    className="flex items-center gap-1.5 mx-auto text-xs text-brand-600 hover:text-brand-700 transition"
                  >
                    <FolderPlus size={13} /> Crear módulo
                  </button>
                )}
              </div>
            ) : (
              modules.map(mod => (
                <NavModule
                  key={mod.id}
                  mod={mod}
                  lessons={lessonsByModule[mod.id] || []}
                  activeLessonId={activeLesson?.id ?? null}
                  completedIds={completedIds}
                  admin={admin}
                  onSelect={selectLesson}
                  onAddLesson={handleAddLesson}
                  onAddModule={handleAddModule}
                />
              ))
            )}
            {/* Admin: add module from bottom of list */}
            {admin && modules.length > 0 && (
              <button
                onClick={handleAddModule}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-body-muted hover:text-brand-600 hover:bg-surface-secondary rounded-lg transition mt-1"
              >
                <FolderPlus size={12} /> Nueva sección
              </button>
            )}
          </div>
        </aside>

        {/* ── Right content panel ──────────────────────────────────────── */}
        <main
          ref={rightPanelRef}
          className="flex-1 overflow-y-auto"
        >
          {activeLesson ? (
            <div className="max-w-3xl mx-auto px-6 py-8">
              {editMode && admin ? (
                <LessonEditor
                  lesson={activeLesson}
                  onSave={handleEditorSave}
                  onCancel={() => setEditMode(false)}
                />
              ) : (
                <LessonContent
                  lesson={activeLesson}
                  isCompleted={completedIds.has(activeLesson.id)}
                  loggedIn={loggedIn}
                  admin={admin}
                  onMarkDone={handleMarkDone}
                  onEditStart={() => setEditMode(true)}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-20">
              <div className="text-4xl">📚</div>
              <p className="font-medium text-body">Selecciona una lección para empezar.</p>
            </div>
          )}
        </main>

      </div>
    </AppShell>
  )
}
