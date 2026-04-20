'use client'

/**
 * Sprint 4 — B-1 Mis Cursos pane.
 *
 * Two data modes depending on the user's role:
 *   - Admin (Alma, per lib/admin.isAdmin): see all published courses.
 *     Each course card has an "Ajustes" cog linking to the admin edit
 *     route owned by Sprint 1 (`/classroom/[slug]/edit`). Until that
 *     route ships the link is inert (disabled styling + hover hint).
 *   - Non-admin member: see their own enrollments. Enrollments with
 *     `hidden = true` are moved into a collapsed "Ocultos" section
 *     so they're hideable without losing access.
 *
 * Pin/hide controls per card persist directly to the enrollments row
 * (admins don't have enrollment rows for their own courses, so pin/
 * hide for admins is stored in `user_preferences` — kept out of this
 * pane for now; we just show the courses).
 */

import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Settings2,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { isAdmin } from '@/lib/admin'
import {
  listEnrollmentsForUser,
  setEnrollmentHidden,
  setEnrollmentPinned,
  Enrollment,
} from '@/lib/enrollments'
import {
  listPublishedCourses,
  CourseLite,
  recordToCourseLite,
} from '@/lib/courses'

interface CardData {
  key: string              // stable React key
  course: CourseLite       // normalized course view
  enrollment?: Enrollment  // only set for non-admin
}

export default function MisCursosPane() {
  const { user } = useAuth()
  const admin = isAdmin(user)
  const [cards, setCards] = useState<CardData[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) { setCards([]); return }
      setError(null)
      try {
        if (admin) {
          const courses = await listPublishedCourses()
          if (cancelled) return
          setCards(courses.map((c) => ({ key: c.id, course: c })))
        } else {
          const enrollments = await listEnrollmentsForUser(user.id)
          if (cancelled) return
          const out: CardData[] = []
          for (const e of enrollments) {
            const exp = e.expand?.course
            if (!exp) continue
            out.push({
              key: e.id,
              course: recordToCourseLite(exp),
              enrollment: e,
            })
          }
          setCards(out)
        }
      } catch (err) {
        if (cancelled) return
        setError((err as Error)?.message || 'No se pudieron cargar tus cursos.')
        setCards([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [user, admin])

  async function togglePin(card: CardData) {
    if (!card.enrollment) return
    const next = !card.enrollment.pinned
    // Optimistic update
    setCards((prev) => prev && prev.map((c) =>
      c.key === card.key && c.enrollment
        ? { ...c, enrollment: { ...c.enrollment, pinned: next } }
        : c
    ))
    try {
      await setEnrollmentPinned(card.enrollment.id, next)
    } catch (err) {
      setError((err as Error)?.message || 'No se pudo actualizar.')
      // Roll back
      setCards((prev) => prev && prev.map((c) =>
        c.key === card.key && c.enrollment
          ? { ...c, enrollment: { ...c.enrollment, pinned: !next } }
          : c
      ))
    }
  }

  async function toggleHide(card: CardData) {
    if (!card.enrollment) return
    const next = !card.enrollment.hidden
    setCards((prev) => prev && prev.map((c) =>
      c.key === card.key && c.enrollment
        ? { ...c, enrollment: { ...c.enrollment, hidden: next } }
        : c
    ))
    try {
      await setEnrollmentHidden(card.enrollment.id, next)
    } catch (err) {
      setError((err as Error)?.message || 'No se pudo actualizar.')
      setCards((prev) => prev && prev.map((c) =>
        c.key === card.key && c.enrollment
          ? { ...c, enrollment: { ...c.enrollment, hidden: !next } }
          : c
      ))
    }
  }

  const [visible, hidden] = useMemo(() => {
    if (!cards) return [[], []] as [CardData[], CardData[]]
    const vis: CardData[] = []
    const hid: CardData[] = []
    for (const c of cards) {
      if (c.enrollment?.hidden) hid.push(c)
      else vis.push(c)
    }
    // Sort: pinned first, then by course title (or sort_order for admin).
    vis.sort((a, b) => {
      const ap = a.enrollment?.pinned ? 1 : 0
      const bp = b.enrollment?.pinned ? 1 : 0
      if (ap !== bp) return bp - ap
      return (a.course.sort_order - b.course.sort_order) || a.course.title.localeCompare(b.course.title)
    })
    return [vis, hid]
  }, [cards])

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h4 className="font-display text-xl mb-1">Mis cursos</h4>
        <p className="text-sm text-body-secondary">
          {admin
            ? 'Todos los cursos publicados del hub. Desde acá podés abrir los ajustes de cada curso.'
            : 'Los cursos en los que estás inscrita. Podés fijar los favoritos arriba u ocultar los que no querés ver.'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs px-3 py-2">
          {error}
        </div>
      )}

      {cards === null ? (
        <LoadingState />
      ) : cards.length === 0 ? (
        <EmptyState admin={admin} />
      ) : (
        <>
          <section className="space-y-2">
            {visible.map((card) => (
              <CourseCard
                key={card.key}
                card={card}
                admin={admin}
                onTogglePin={togglePin}
                onToggleHide={toggleHide}
              />
            ))}
          </section>
          {hidden.length > 0 && (
            <HiddenSection
              cards={hidden}
              onToggleHide={toggleHide}
            />
          )}
        </>
      )}

      {admin && (
        <p className="text-xs text-body-muted pt-2">
          <span className="inline-flex items-center gap-1">
            <Plus size={11} /> Crear curso llega en Sprint 1 (Classroom CRUD).
          </span>
        </p>
      )}
    </div>
  )
}

/* ─── Card ──────────────────────────────────────────── */

function CourseCard({
  card,
  admin,
  onTogglePin,
  onToggleHide,
}: {
  card: CardData
  admin: boolean
  onTogglePin: (c: CardData) => void
  onToggleHide: (c: CardData) => void
}) {
  const { course, enrollment } = card
  const pinned = enrollment?.pinned ?? false

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-surface-secondary/50 transition">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {course.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookOpen size={18} className="text-brand-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h5 className="text-sm font-semibold truncate">{course.title}</h5>
          {pinned && (
            <span className="inline-flex items-center gap-0.5 text-xs text-brand font-medium" style={{ color: 'rgb(var(--brand))' }}>
              <Pin size={10} /> fijado
            </span>
          )}
        </div>
        {course.tagline && (
          <p className="text-xs text-body-muted truncate">{course.tagline}</p>
        )}
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {/* Pin: only for non-admin (enrollment-based) */}
        {enrollment && (
          <button
            type="button"
            onClick={() => onTogglePin(card)}
            className="p-2 rounded-lg hover:bg-surface-secondary text-body-muted transition"
            title={pinned ? 'Desfijar' : 'Fijar arriba'}
          >
            {pinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
        )}
        {/* Hide: only for non-admin */}
        {enrollment && (
          <button
            type="button"
            onClick={() => onToggleHide(card)}
            className="p-2 rounded-lg hover:bg-surface-secondary text-body-muted transition"
            title={enrollment.hidden ? 'Mostrar' : 'Ocultar'}
          >
            {enrollment.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
        {/* Admin cog */}
        {admin && <AdminCog slug={course.slug} />}
        {/* Open course */}
        <a
          href={`/classroom#${course.slug}`}
          className="p-2 rounded-lg hover:bg-surface-secondary text-body-muted transition"
          title="Abrir curso"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  )
}

function AdminCog({ slug }: { slug: string }) {
  // Sprint 1 owns the edit route. Until it ships the link is visible
  // but inert — click triggers a small tooltip saying "pronto".
  const [hint, setHint] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        setHint(true)
        setTimeout(() => setHint(false), 1600)
      }}
      className="relative p-2 rounded-lg hover:bg-surface-secondary text-body-muted transition"
      title="Ajustes del curso (Sprint 1)"
      data-slug={slug}
    >
      <Settings2 size={14} />
      {hint && (
        <span className="absolute -top-8 right-0 whitespace-nowrap text-[10px] bg-black text-white px-2 py-1 rounded shadow">
          Pronto (Sprint 1)
        </span>
      )}
    </button>
  )
}

/* ─── Hidden section ─────────────────────────────────── */

function HiddenSection({
  cards,
  onToggleHide,
}: {
  cards: CardData[]
  onToggleHide: (c: CardData) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className="pt-3 border-t border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs text-body-secondary hover:text-body transition"
      >
        {open ? '▾' : '▸'} Ocultos ({cards.length})
      </button>
      {open && (
        <div className="mt-2 space-y-2 opacity-75">
          {cards.map((card) => (
            <CourseCard
              key={card.key}
              card={card}
              admin={false}
              onTogglePin={() => {}}
              onToggleHide={onToggleHide}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/* ─── Empty / Loading ────────────────────────────────── */

function LoadingState() {
  return (
    <div className="space-y-2 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-surface-secondary" />
      ))}
    </div>
  )
}

function EmptyState({ admin }: { admin: boolean }) {
  return (
    <div className="text-center py-10 border border-dashed border-border rounded-xl">
      <BookOpen size={28} className="mx-auto text-body-muted mb-2" />
      <p className="text-sm font-medium mb-1">
        {admin ? 'Todavía no publicaste cursos' : 'No estás inscrita en ningún curso'}
      </p>
      <p className="text-xs text-body-muted">
        {admin
          ? 'Cuando Sprint 1 habilite el CRUD de Classroom, podrás crear tu primer curso desde ahí.'
          : 'Explorá el Classroom para inscribirte en el próximo curso que se abra.'}
      </p>
    </div>
  )
}
