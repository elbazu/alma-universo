'use client'

/**
 * app/classroom/[courseSlug]/page.tsx — Lesson Player.
 *
 * Two-panel layout:
 *   Left  — course progress bar, module sections, clickable lesson list,
 *            checkmarks on completed lessons, gold highlight on active.
 *   Right — lesson content: video embed or header image, description,
 *            external link, "Mark as done" button.
 *
 * Last-visited lesson is persisted in localStorage so the user lands
 * on the same lesson when they navigate away and come back.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronLeft, CheckCircle2, Circle,
  ExternalLink, Loader2, Lock, PlayCircle,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { getPb } from '@/lib/pocketbase'
import { isAdmin } from '@/lib/admin'
import {
  getCourseBySlug, listModules, listLessons,
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
  // YouTube
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
  )
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
  // Vimeo
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

// ─── Module section in left nav ───────────────────────────────────────────────

function NavModule({
  mod,
  lessons,
  activeLessonId,
  completedIds,
  onSelect,
}: {
  mod: ModuleRecord
  lessons: LessonRecord[]
  activeLessonId: string | null
  completedIds: Set<string>
  onSelect: (lesson: LessonRecord) => void
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
          {lessons.map((lesson, idx) => {
            const isActive    = lesson.id === activeLessonId
            const isCompleted = completedIds.has(lesson.id)
            return (
              <button
                key={lesson.id}
                onClick={() => onSelect(lesson)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm transition ${
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
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Lesson content panel ─────────────────────────────────────────────────────

function LessonContent({
  lesson,
  isCompleted,
  loggedIn,
  onMarkDone,
}: {
  lesson: LessonRecord
  isCompleted: boolean
  loggedIn: boolean
  onMarkDone: () => Promise<void>
}) {
  const [marking, setMarking] = useState(false)
  const embedUrl = toEmbedUrl(lesson.video_url)

  async function handleMark() {
    setMarking(true)
    await onMarkDone()
    setMarking(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <h1 className="font-display text-xl font-semibold text-gray-900 leading-snug">
          {lesson.title}
        </h1>
        {loggedIn && (
          <button
            onClick={handleMark}
            disabled={marking}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isCompleted
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                : 'bg-surface border-border text-body-muted hover:border-brand-400 hover:text-brand-600'
            }`}
          >
            {marking ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 size={13} />
            ) : (
              <Circle size={13} />
            )}
            {isCompleted ? 'Completada' : 'Marcar como hecha'}
          </button>
        )}
      </div>

      {/* Media — video takes priority over image */}
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

      {/* Description */}
      {lesson.description && (
        <div className="prose prose-sm max-w-none text-body leading-relaxed mb-4 whitespace-pre-wrap">
          {lesson.description}
        </div>
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
  const params = useParams()
  const router = useRouter()
  const courseSlug = params.courseSlug as string

  const pb       = getPb()
  const loggedIn = Boolean(pb.authStore.record)
  const admin    = isAdmin(pb.authStore.record as { email?: string } | null)

  // Data
  const [course,  setCourse]  = useState<CourseAdmin | null>(null)
  const [modules, setModules] = useState<ModuleRecord[]>([])
  // lessons keyed by moduleId
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, LessonRecord[]>>({})
  const [allLessons, setAllLessons] = useState<LessonRecord[]>([])

  // Active lesson
  const [activeLesson, setActiveLesson] = useState<LessonRecord | null>(null)

  // Progress
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // ── Load everything on mount ──────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    const course = await getCourseBySlug(courseSlug)
    if (!course) { setNotFound(true); setLoading(false); return }
    setCourse(course)

    // Load modules
    const mods = await listModules(course.id)
    // For non-admins, filter to published only
    const visibleMods = admin ? mods : mods.filter(m => m.is_published)
    setModules(visibleMods)

    // Load all lessons for each module in parallel
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

    // Load completions
    const completed = await getAllCompletedLessonIds()
    setCompletedIds(completed)

    // Determine starting lesson: last visited or first
    const lastId = loadLastLesson(course.id)
    const found  = lastId ? flat.find(l => l.id === lastId) ?? null : null
    const start  = found ?? flat[0] ?? null
    setActiveLesson(start)

    setLoading(false)
  }, [courseSlug, admin])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Navigate to a lesson ──────────────────────────────────────────────────
  function selectLesson(lesson: LessonRecord) {
    setActiveLesson(lesson)
    if (course) saveLastLesson(course.id, lesson.id)
    // Scroll right panel to top
    rightPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const rightPanelRef = useRef<HTMLDivElement>(null)

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

  // ── Progress ─────────────────────────────────────────────────────────────
  const progressPercent = allLessons.length === 0
    ? 0
    : Math.round((allLessons.filter(l => completedIds.has(l.id)).length / allLessons.length) * 100)

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
      </>
    )
  }

  if (notFound || !course) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-3">
          <p className="text-lg font-semibold text-body">Curso no encontrado</p>
          <button onClick={() => router.push('/classroom')} className="text-sm text-brand-600 hover:underline">
            ← Volver al Classroom
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-60px)] overflow-hidden">

        {/* ── Left nav panel ─────────────────────────────────────────────── */}
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
              <p className="text-xs text-body-muted px-3 py-4 text-center">
                Sin módulos todavía.
              </p>
            ) : (
              modules.map(mod => (
                <NavModule
                  key={mod.id}
                  mod={mod}
                  lessons={lessonsByModule[mod.id] || []}
                  activeLessonId={activeLesson?.id ?? null}
                  completedIds={completedIds}
                  onSelect={selectLesson}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Right content panel ────────────────────────────────────────── */}
        <main
          ref={rightPanelRef}
          className="flex-1 overflow-y-auto"
        >
          {activeLesson ? (
            <div className="max-w-3xl mx-auto px-6 py-8">
              <LessonContent
                lesson={activeLesson}
                isCompleted={completedIds.has(activeLesson.id)}
                loggedIn={loggedIn}
                onMarkDone={handleMarkDone}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-20">
              <div className="text-4xl">📚</div>
              <p className="font-medium text-body">Selecciona una lección para empezar.</p>
            </div>
          )}
        </main>

      </div>
    </>
  )
}
