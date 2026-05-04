'use client'

/**
 * /home — Post-login dashboard.
 *
 * Shows:
 *  - Welcome banner with user's first name
 *  - "Mis Cursos Inscritos" — enrolled course cards
 *  - "Catálogo de Formaciones" — all courses with category filter
 *
 * Courses: tries PocketBase first; falls back to STATIC_COURSES seed data.
 * Each card opens a CourseModal on click (enrolled → "Continuar curso",
 * not enrolled → "Inscribirme ahora").
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { displayName as profileDisplayName } from '@/lib/profile'
import { listPublishedCourses } from '@/lib/classroom-crud'

// ─── Color tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:        '#FAF7F2',
  bgCard:    '#FFFFFF',
  gold:      '#C8942A',
  amber:     '#E07B2A',
  green:     '#4A8C5C',
  greenPale: '#E8F5ED',
  text:      '#2C1F0E',
  textMid:   '#6B4F35',
  textDim:   '#A8906C',
  border:    '#E8DECE',
  borderGold:'#E0C070',
  shadow:    'rgba(120,80,20,0.10)',
  shadowMd:  'rgba(120,80,20,0.16)',
}

// ─── Static course seed data ──────────────────────────────────────────────────

interface Course {
  id: string
  title: string
  category: string
  tag: string
  tagColor: string
  tagBg: string
  accent: string
  accentPale: string
  icon: string
  price: number
  priceLabel: string
  duration: string
  desc: string
  enrolled: boolean
  slug?: string
}

const STATIC_COURSES: Course[] = [
  {
    id: 'nutricion', title: 'Nutrición Alineada a Chakras',
    category: 'Nutrición', tag: 'POPULAR',
    tagColor: '#C4587A', tagBg: '#FCEEF3',
    accent: '#E07B2A', accentPale: '#FFF0E0',
    icon: '🌿', price: 0, priceLabel: 'Gratis',
    duration: '6 semanas · 18 lecciones',
    desc: 'Descubre cómo alinear tu alimentación con los centros energéticos de tu cuerpo. Un viaje transformador entre nutrición holística y sabiduría ancestral.',
    enrolled: true,
  },
  {
    id: 'cristales', title: 'Cristaloterapia: Sanación con Piedras',
    category: 'Cristales', tag: 'NUEVO',
    tagColor: '#3A8C8C', tagBg: '#E6F4F4',
    accent: '#3A8C8C', accentPale: '#E6F4F4',
    icon: '💎', price: 197, priceLabel: '$197 USD',
    duration: '4 semanas · 12 lecciones',
    desc: 'Aprende a seleccionar, limpiar y programar cristales para potenciar tu energía, sanar bloqueos y elevar tu vibración. Incluye guía de piedras.',
    enrolled: false,
  },
  {
    id: 'meditacion', title: 'Meditación Theta y Ondas Cerebrales',
    category: 'Meditación', tag: 'EN VIVO',
    tagColor: '#7B6BAA', tagBg: '#EEE9F8',
    accent: '#7B6BAA', accentPale: '#EEE9F8',
    icon: '🧠', price: 297, priceLabel: '$297 USD',
    duration: '8 semanas · Sesiones en vivo',
    desc: 'Entra al estado theta profundo para reprogramar creencias limitantes, sanar heridas del pasado y manifestar desde la consciencia plena.',
    enrolled: false,
  },
  {
    id: 'geometria', title: 'Geometría Sagrada Aplicada',
    category: 'Espiritualidad', tag: 'AVANZADO',
    tagColor: '#C8942A', tagBg: '#FDE9A2',
    accent: '#C8942A', accentPale: '#FDE9A2',
    icon: '✦', price: 147, priceLabel: '$147 USD',
    duration: '3 semanas · 9 lecciones',
    desc: 'Explora los patrones matemáticos del universo — desde el Cubo de Metatrón hasta la Flor de la Vida — y úsalos en tu práctica espiritual diaria.',
    enrolled: false,
  },
  {
    id: 'luna', title: 'Ritual de Luna: Ciclos y Magia',
    category: 'Luna', tag: 'GRATIS',
    tagColor: '#4A8C5C', tagBg: '#E8F5ED',
    accent: '#4A8C5C', accentPale: '#E8F5ED',
    icon: '🌙', price: 0, priceLabel: 'Gratis',
    duration: '2 semanas · 6 lecciones',
    desc: 'Aprende a trabajar con los ciclos lunares para manifestar, soltar y renovar tu energía. Incluye calendario lunar 2026 y rituales guiados.',
    enrolled: true,
  },
  {
    id: 'retiro', title: 'Despertar del Alma: Retiro Online',
    category: 'Retiro', tag: 'DESTACADO',
    tagColor: '#C4587A', tagBg: '#FCEEF3',
    accent: '#C4587A', accentPale: '#FCEEF3',
    icon: '🕊️', price: 497, priceLabel: '$497 USD',
    duration: '5 días intensivos · En vivo',
    desc: 'Un retiro transformador de 5 días en formato online. Meditaciones guiadas, respiración consciente, movimiento sagrado y comunidad de almas despiertas.',
    enrolled: false,
  },
]

// ─── Mini MetatronCube SVG ────────────────────────────────────────────────────

function MetatronMini({ size = 120, opacity = 0.12 }: { size?: number; opacity?: number }) {
  const d = 70
  const centers: [number, number][] = [[0, 0]]
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 30) * Math.PI / 180
    centers.push([d * Math.cos(a), d * Math.sin(a)])
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * 60) * Math.PI / 180
    centers.push([2 * d * Math.cos(a), 2 * d * Math.sin(a)])
  }
  const vb = d * 2.65
  return (
    <svg viewBox={`${-vb} ${-vb} ${vb * 2} ${vb * 2}`} width={size} height={size}
      style={{ display: 'block', opacity, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="mmg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="50%" stopColor="#C8942A" />
          <stop offset="100%" stopColor="#8B5E10" />
        </linearGradient>
      </defs>
      {centers.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={d}
          fill="none" stroke="url(#mmg)"
          strokeWidth={i === 0 ? 1.6 : 1.0}
          strokeOpacity={i === 0 ? 0.95 : 0.7} />
      ))}
    </svg>
  )
}

// ─── Course card ──────────────────────────────────────────────────────────────

function CourseCard({ course, onClick }: { course: Course; onClick: (c: Course) => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={() => onClick(course)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.bgCard, borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        border: `1px solid ${hover ? course.accent + '55' : C.border}`,
        boxShadow: hover ? `0 10px 32px ${C.shadowMd}` : `0 2px 10px ${C.shadow}`,
        transform: hover ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all .22s ease', flexShrink: 0,
      }}
    >
      {/* Image area */}
      <div style={{
        height: 140,
        background: `linear-gradient(135deg, ${course.accentPale} 0%, white 100%)`,
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <span style={{ fontSize: 48, opacity: 0.3, userSelect: 'none', position: 'relative', zIndex: 1 }}>
          {course.icon}
        </span>
        <div style={{ position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center' }}>
          <MetatronMini size={150} opacity={0.12} />
        </div>
        {/* Tag */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          padding: '3px 10px', borderRadius: 20,
          background: course.tagBg, color: course.tagColor,
          fontSize: 10, fontFamily: 'Cinzel, serif', letterSpacing: '0.1em',
          border: `1px solid ${course.tagColor}33`, zIndex: 2,
        }}>
          {course.tag}
        </div>
        {/* Enrolled badge */}
        {course.enrolled && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            padding: '3px 10px', borderRadius: 20,
            background: C.greenPale, color: C.green,
            fontSize: 10, fontFamily: 'Cinzel, serif', letterSpacing: '0.08em',
            border: `1px solid ${C.green}33`, zIndex: 2,
          }}>
            ✓ Inscrito
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontSize: 10, color: course.accent, fontFamily: 'Cinzel, serif',
          letterSpacing: '0.12em', marginBottom: 5 }}>
          {course.category.toUpperCase()}
        </div>
        <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 17, fontWeight: 400,
          color: C.text, lineHeight: 1.3, marginBottom: 8 }}>
          {course.title}
        </div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>
          {course.duration}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 15, fontWeight: 500,
            color: course.price === 0 ? C.green : C.gold }}>
            {course.priceLabel}
          </span>
          <span style={{ fontSize: 12, color: course.accent }}>Ver más →</span>
        </div>
      </div>
    </div>
  )
}

// ─── Course modal ─────────────────────────────────────────────────────────────

function CourseModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const router = useRouter()

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(44,31,14,0.45)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        animation: 'fadeIn .2s ease both',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 560, background: '#FFFFFF', borderRadius: 20,
        overflow: 'hidden', boxShadow: '0 24px 80px rgba(44,31,14,0.22)',
        animation: 'scaleIn .25s ease both',
      }}>
        {/* Hero banner */}
        <div style={{
          height: 200,
          background: `linear-gradient(135deg, ${course.accentPale} 0%, ${course.accentPale}cc 100%)`,
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <span style={{ fontSize: 72, opacity: 0.35, userSelect: 'none', filter: 'saturate(0.5)', zIndex: 1, position: 'relative' }}>
            {course.icon}
          </span>
          <div style={{ position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center' }}>
            <MetatronMini size={220} opacity={0.18} />
          </div>
          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14, width: 32, height: 32,
            borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.85)', color: C.textMid, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 8px ${C.shadow}`, zIndex: 3,
          }}>✕</button>
          {/* Tag */}
          <div style={{
            position: 'absolute', top: 14, left: 14,
            padding: '4px 12px', borderRadius: 20,
            background: course.tagBg, color: course.tagColor,
            fontSize: 11, fontFamily: 'Cinzel, serif', letterSpacing: '0.1em',
            border: `1px solid ${course.tagColor}44`, zIndex: 3,
          }}>
            {course.tag}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 26px 28px' }}>
          <div style={{ fontSize: 11, color: course.accent, fontFamily: 'Cinzel, serif',
            letterSpacing: '0.12em', marginBottom: 6 }}>
            {course.category.toUpperCase()}
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 26,
            fontWeight: 400, color: C.text, lineHeight: 1.25, marginBottom: 10 }}>
            {course.title}
          </h2>
          <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7, marginBottom: 16 }}>
            {course.desc}
          </p>

          {/* Duration row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '10px 14px', borderRadius: 10,
            background: '#FAF7F2', border: `1px solid ${C.border}`,
          }}>
            <svg width="15" height="15" fill="none" stroke={C.textDim} strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: 13, color: C.textMid }}>{course.duration}</span>
          </div>

          {/* Price + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 2 }}>Precio</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22,
                color: course.price === 0 ? C.green : C.gold, fontWeight: 500 }}>
                {course.priceLabel}
              </div>
            </div>

            {course.enrolled ? (
              // Enrolled → outlined button
              <button
                onClick={() => { router.push(`/classroom${course.slug ? '/' + course.slug : ''}`); onClose() }}
                style={{
                  flex: 1, maxWidth: 220, padding: '13px 20px', borderRadius: 10,
                  border: `2px solid ${course.accent}`, cursor: 'pointer',
                  background: 'transparent', color: course.accent,
                  fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: '0.08em',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = course.accentPale }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                ▶ Continuar curso
              </button>
            ) : (
              // Not enrolled → filled gradient button
              <button
                onClick={() => { router.push('/classroom'); onClose() }}
                style={{
                  flex: 1, maxWidth: 220, padding: '13px 20px', borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${course.accent}, ${C.gold})`,
                  color: 'white', fontFamily: 'Cinzel, serif', fontSize: 13,
                  letterSpacing: '0.08em',
                  boxShadow: '0 4px 18px rgba(200,148,42,0.35)',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
              >
                {course.price === 0 ? '✦ Inscribirme gratis' : '✦ Inscribirme ahora'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 12, letterSpacing: '0.16em',
        color: C.textMid, textTransform: 'uppercase', margin: 0 }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: 1, background: C.border, marginLeft: 4 }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const { profile } = useProfile()
  const router = useRouter()

  const [courses, setCourses]           = useState<Course[]>(STATIC_COURSES)
  const [selectedCourse, setSelected]   = useState<Course | null>(null)
  const [activeCategory, setActiveCategory] = useState('Todos')

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !user) router.push('/')
  }, [user, isLoading, router])

  // Try to load courses from PocketBase
  useEffect(() => {
    listPublishedCourses()
      .then(pbCourses => {
        if (pbCourses.length > 0) {
          // Map PB courses to our Course shape, using static data as enrichment
          const mapped: Course[] = pbCourses.map((pb, i) => {
            const seed = STATIC_COURSES[i % STATIC_COURSES.length]
            return {
              id:         pb.id,
              title:      pb.title,
              category:   pb.tagline || seed.category,
              tag:        pb.access_type === 'free' ? 'GRATIS' : seed.tag,
              tagColor:   seed.tagColor,
              tagBg:      seed.tagBg,
              accent:     seed.accent,
              accentPale: seed.accentPale,
              icon:       seed.icon,
              price:      pb.access_type === 'free' ? 0 : pb.price_cents / 100,
              priceLabel: pb.access_type === 'free' ? 'Gratis' : `$${pb.price_cents / 100} USD`,
              duration:   seed.duration,
              desc:       pb.description || seed.desc,
              enrolled:   seed.enrolled,
              slug:       pb.slug,
            }
          })
          setCourses(mapped)
        }
      })
      .catch(() => {/* keep static data */})
  }, [])

  const firstName = profileDisplayName(profile, (user?.name as string) || '').split(' ')[0] || 'alumna'
  const enrolledCourses  = courses.filter(c => c.enrolled)
  const categories       = ['Todos', ...Array.from(new Set(courses.map(c => c.category)))]
  const filteredCourses  = activeCategory === 'Todos'
    ? courses
    : courses.filter(c => c.category === activeCategory)

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#FAF7F2' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%',
          border: '2px solid #E0C070', borderTopColor: '#C8942A',
          animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* ── Welcome banner ── */}
        <div style={{
          background: 'rgba(255,255,255,0.75)', border: `1px solid ${C.borderGold}`,
          borderRadius: 20, padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40,
          boxShadow: `0 2px 16px ${C.shadow}`,
        }}>
          <MetatronMini size={52} opacity={0.55} />
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28,
              fontWeight: 300, color: C.text, margin: 0, lineHeight: 1.2 }}>
              Bienvenida,{' '}
              <em style={{ color: C.gold, fontStyle: 'italic' }}>{firstName}</em> ✦
            </h1>
            <p style={{ fontSize: 14, color: C.textMid, marginTop: 4, margin: '4px 0 0' }}>
              Tu camino de despertar continúa.{' '}
              {enrolledCourses.length > 0 && (
                <span>
                  Tienes{' '}
                  <span style={{ color: C.gold, fontWeight: 500 }}>
                    {enrolledCourses.length} {enrolledCourses.length === 1 ? 'curso activo' : 'cursos activos'}
                  </span>.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── Mis Cursos Inscritos ── */}
        {enrolledCourses.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <SectionHeader icon="📚" title="Mis Cursos Inscritos" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {enrolledCourses.map(c => (
                <CourseCard key={c.id} course={c} onClick={setSelected} />
              ))}
            </div>
          </section>
        )}

        {/* ── Catálogo de Formaciones ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>🌐</span>
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 12, letterSpacing: '0.16em',
                color: C.textMid, textTransform: 'uppercase', margin: 0 }}>
                Catálogo de Formaciones
              </h2>
            </div>
            {/* Category pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                    border: `1px solid ${activeCategory === cat ? C.gold : C.border}`,
                    background: activeCategory === cat ? C.gold : 'transparent',
                    color: activeCategory === cat ? 'white' : C.textMid,
                    fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 500,
                    transition: 'all .15s',
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {filteredCourses.map(c => (
              <CourseCard key={c.id} course={c} onClick={setSelected} />
            ))}
          </div>
        </section>
      </div>

      {/* Course modal */}
      {selectedCourse && (
        <CourseModal course={selectedCourse} onClose={() => setSelected(null)} />
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: scale(1) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </AppShell>
  )
}
