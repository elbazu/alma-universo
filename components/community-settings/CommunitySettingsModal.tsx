'use client'

import { useEffect, useRef, useState, ReactNode, ChangeEvent } from 'react'
import {
  X, Home, Compass, Settings2, Wallet, Tag, Users, Puzzle,
  Shield, LayoutGrid, CreditCard, AlertTriangle, Loader2, Check,
} from 'lucide-react'
import { useCommunityData } from '@/context/CommunityDataContext'
import { slugify } from '@/lib/community'

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-surface-secondary border border-border rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ' +
  'placeholder:text-body-muted text-body transition'

type PaneKey =
  | 'general' | 'tabs' | 'billing'
  // Locked panes (shown as "Próximamente" for Sprint 3+)
  | 'dashboard' | 'discovery' | 'payouts' | 'pricing' | 'affiliates' | 'plugins'

interface NavItem {
  key: PaneKey
  label: string
  icon: ReactNode
  locked?: boolean
}

const NAV: NavItem[] = [
  // Sprint 3+ (locked for now)
  { key: 'dashboard',  label: 'Panel',        icon: <Home size={16} />,      locked: true },
  { key: 'discovery',  label: 'Descubrir',    icon: <Compass size={16} />,   locked: true },
  // Sprint 2 — active
  { key: 'general',    label: 'General',      icon: <Settings2 size={16} /> },
  { key: 'tabs',       label: 'Pestañas',     icon: <LayoutGrid size={16} /> },
  // Sprint 3+ (locked for now)
  { key: 'payouts',    label: 'Cobros',       icon: <Wallet size={16} />,    locked: true },
  { key: 'pricing',    label: 'Precios',      icon: <Tag size={16} />,       locked: true },
  { key: 'affiliates', label: 'Afiliados',    icon: <Users size={16} />,     locked: true },
  { key: 'plugins',    label: 'Plugins',      icon: <Puzzle size={16} />,    locked: true },
  // Sprint 2 — active
  { key: 'billing',    label: 'Facturación',  icon: <CreditCard size={16} /> },
]

const PANE_TITLES: Record<PaneKey, string> = {
  dashboard:  'Panel',
  discovery:  'Descubrir',
  general:    'General',
  tabs:       'Pestañas del hub',
  payouts:    'Cobros',
  pricing:    'Precios',
  affiliates: 'Afiliados',
  plugins:    'Plugins',
  billing:    'Facturación',
}

interface Props {
  open: boolean
  onClose: () => void
  initialPane?: PaneKey
}

export default function CommunitySettingsModal({ open, onClose, initialPane = 'general' }: Props) {
  const [pane, setPane] = useState<PaneKey>(initialPane)

  useEffect(() => { if (open) setPane(initialPane) }, [open, initialPane])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const selected = NAV.find(n => n.key === pane)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface text-body w-full max-w-4xl h-[86vh] max-h-[760px] rounded-2xl shadow-2xl border border-border flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="w-60 bg-surface-secondary border-r border-border flex flex-col">
          <div className="px-4 h-12 flex items-center border-b border-border">
            <h2 className="text-sm font-semibold">Configurar comunidad</h2>
          </div>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {NAV.map(item => (
              <button
                key={item.key}
                onClick={() => !item.locked && setPane(item.key)}
                disabled={item.locked}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition text-left ${
                  pane === item.key
                    ? 'bg-brand-soft text-brand'
                    : item.locked
                      ? 'text-body-muted cursor-not-allowed'
                      : 'text-body-secondary hover:bg-surface hover:text-body'
                }`}
                style={pane === item.key ? { backgroundColor: 'rgb(var(--brand-soft))', color: 'rgb(var(--brand))' } : undefined}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.locked && (
                  <span className="text-[10px] uppercase tracking-wide text-body-muted border border-border rounded px-1 py-0.5">
                    Próximamente
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1 flex flex-col min-w-0">
          <header className="h-12 px-5 flex items-center justify-between border-b border-border">
            <h3 className="text-sm font-semibold">{selected?.label || PANE_TITLES[pane]}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-body-muted hover:text-body transition"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            {pane === 'general' && <GeneralPane />}
            {pane === 'tabs' && <TabsPane />}
            {pane === 'billing' && <BillingStubPane />}
            {(pane === 'dashboard' || pane === 'discovery' || pane === 'payouts'
              || pane === 'pricing' || pane === 'affiliates' || pane === 'plugins') && (
              <LockedPane title={PANE_TITLES[pane]} />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ─── General ───────────────────────────────────────── */

function GeneralPane() {
  const { settings, isLoading, error, save, saveFiles } = useCommunityData()

  const [name, setName] = useState(settings.name)
  const [description, setDescription] = useState(settings.description)
  const [supportEmail, setSupportEmail] = useState(settings.support_email)
  const [isPublic, setIsPublic] = useState(settings.is_public)
  const [editingSlug, setEditingSlug] = useState(false)
  const [slug, setSlug] = useState(settings.url_slug)

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [localError, setLocalError] = useState<string | null>(null)

  const iconInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(settings.name)
    setDescription(settings.description)
    setSupportEmail(settings.support_email)
    setIsPublic(settings.is_public)
    setSlug(settings.url_slug)
  }, [settings])

  async function onSave() {
    setStatus('saving')
    setLocalError(null)
    try {
      await save({
        name: name.slice(0, 30),
        description: description.slice(0, 150),
        support_email: supportEmail,
        is_public: isPublic,
        url_slug: slugify(slug),
      })
      setStatus('saved')
      setEditingSlug(false)
      setTimeout(() => setStatus('idle'), 2000)
    } catch (e) {
      setStatus('idle')
      setLocalError((e as Error)?.message || 'No se pudo guardar.')
    }
  }

  async function onPickIcon(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('saving')
    try {
      await saveFiles({ icon: file })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      setStatus('idle')
      setLocalError((err as Error)?.message || 'No se pudo subir el icono.')
    }
  }

  async function onPickCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('saving')
    try {
      await saveFiles({ cover: file })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      setStatus('idle')
      setLocalError((err as Error)?.message || 'No se pudo subir la portada.')
    }
  }

  if (isLoading) {
    return <div className="text-sm text-body-muted flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Cargando…</div>
  }

  return (
    <div className="max-w-2xl space-y-6">
      {(error || localError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
          {localError || error}
        </div>
      )}

      {/* Images */}
      <div className="grid grid-cols-[auto,1fr] gap-4 items-start">
        <div>
          <label className="text-xs font-medium text-body-secondary block mb-2">Icono (128×128)</label>
          <button
            onClick={() => iconInputRef.current?.click()}
            className="w-24 h-24 rounded-2xl border border-dashed border-border bg-surface-secondary hover:border-brand-400 overflow-hidden flex items-center justify-center"
          >
            {settings.icon_url ? (
              <img src={settings.icon_url} alt="Icono" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-body-muted text-center px-2">Subir icono</span>
            )}
          </button>
          <input
            ref={iconInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onPickIcon}
          />
        </div>

        <div className="flex-1">
          <label className="text-xs font-medium text-body-secondary block mb-2">Portada (1084×576)</label>
          <button
            onClick={() => coverInputRef.current?.click()}
            className="w-full aspect-[1084/576] rounded-xl border border-dashed border-border bg-surface-secondary hover:border-brand-400 overflow-hidden flex items-center justify-center"
          >
            {settings.cover_url ? (
              <img src={settings.cover_url} alt="Portada" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-body-muted">Subir portada</span>
            )}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onPickCover}
          />
        </div>
      </div>

      {/* Name */}
      <Field label="Nombre del grupo" hint={`${name.length}/30`}>
        <input
          type="text"
          value={name}
          maxLength={30}
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLASS}
        />
      </Field>

      {/* Description */}
      <Field label="Descripción" hint={`${description.length}/150`}>
        <textarea
          value={description}
          maxLength={150}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`${INPUT_CLASS} resize-none`}
        />
      </Field>

      {/* URL */}
      <Field label="URL personalizada" hint="Se usa en los links públicos del hub.">
        <div className="flex items-center gap-2">
          <span className="text-sm text-body-muted">mialmauniverso.com/</span>
          {editingSlug ? (
            <>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={`${INPUT_CLASS} flex-1`}
              />
              <button
                onClick={() => { setSlug(settings.url_slug); setEditingSlug(false) }}
                className="text-xs text-body-muted hover:text-body"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <span className="text-sm font-medium">{settings.url_slug}</span>
              <button
                onClick={() => setEditingSlug(true)}
                className="text-xs text-brand-600 hover:underline"
              >
                Cambiar URL
              </button>
            </>
          )}
        </div>
      </Field>

      {/* Public / Private */}
      <Field label="Visibilidad">
        <div className="space-y-2">
          <Radio
            checked={isPublic}
            onChange={() => setIsPublic(true)}
            title="Público"
            description="Cualquiera puede ver la página principal del hub."
          />
          <Radio
            checked={!isPublic}
            onChange={() => setIsPublic(false)}
            title="Privado"
            description="Solo miembros inscritos pueden ver el contenido."
          />
        </div>
      </Field>

      {/* Support email */}
      <Field label="Email de soporte" hint="Donde te escriben los miembros si tienen problemas.">
        <input
          type="email"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
          className={INPUT_CLASS}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          onClick={onSave}
          disabled={status === 'saving'}
          className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
          style={{ backgroundColor: 'rgb(var(--brand))' }}
        >
          {status === 'saving' && <Loader2 size={14} className="animate-spin" />}
          {status === 'saved' && <Check size={14} />}
          {status === 'saved' ? 'Guardado' : 'Guardar cambios'}
        </button>
        {status === 'saved' && (
          <span className="text-xs text-green-700">Los cambios se aplicaron en todo el hub.</span>
        )}
      </div>
    </div>
  )
}

/* ─── Tabs ──────────────────────────────────────────── */

type TabKey =
  | 'show_classroom_tab'
  | 'show_calendar_tab'
  | 'show_map_tab'
  | 'show_members_tab'
  | 'show_about_tab'

function TabsPane() {
  const { settings, save, isLoading, error } = useCommunityData()
  const [localError, setLocalError] = useState<string | null>(null)
  const [busy, setBusy] = useState<TabKey | null>(null)

  async function toggle(key: TabKey, next: boolean) {
    setBusy(key)
    setLocalError(null)
    try {
      await save({ [key]: next } as Record<TabKey, boolean>)
    } catch (e) {
      setLocalError((e as Error)?.message || 'No se pudo guardar el cambio.')
    } finally {
      setBusy(null)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-body-muted flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Cargando…</div>
  }

  const rows: { key: TabKey; label: string; description: string }[] = [
    { key: 'show_classroom_tab', label: 'Classroom', description: 'Cursos, módulos y lecciones.' },
    { key: 'show_calendar_tab',  label: 'Calendario', description: 'Eventos en vivo y sesiones.' },
    { key: 'show_map_tab',       label: 'Mapa',       description: 'Mapa mundial de miembros inscritos.' },
    { key: 'show_members_tab',   label: 'Miembros',   description: 'Lista pública de miembros del hub.' },
    { key: 'show_about_tab',     label: 'Acerca de',  description: 'Página de introducción al hub.' },
  ]

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-body-secondary">
        Controlá qué pestañas se ven en el nav principal. Si apagás una, desaparece para todos los miembros.
      </p>

      {(error || localError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
          {localError || error}
        </div>
      )}

      <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
        {rows.map(row => {
          const enabled = Boolean(settings[row.key])
          return (
            <div key={row.key} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1">
                <div className="text-sm font-medium">{row.label}</div>
                <div className="text-xs text-body-secondary">{row.description}</div>
              </div>
              <Switch
                checked={enabled}
                onChange={(v) => toggle(row.key, v)}
                loading={busy === row.key}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Billing stub ──────────────────────────────────── */

function BillingStubPane() {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-xs">
        Durante la beta, la facturación del hub está desactivada. Esta pantalla es solo una vista previa.
      </div>

      <section>
        <h4 className="font-display text-lg mb-2">Plan actual</h4>
        <div className="border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Hobby (gratis)</div>
            <div className="text-xs text-body-secondary">Hasta 50 miembros · Sin cobros por curso.</div>
          </div>
          <span className="text-xs uppercase tracking-wide text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">Activo</span>
        </div>
      </section>

      <section>
        <h4 className="font-display text-lg mb-2">Tarjeta de pago</h4>
        <div className="border border-dashed border-border rounded-xl p-4 text-sm text-body-muted">
          No hay tarjeta guardada todavía. Cuando el flag <code className="bg-surface-secondary px-1 rounded">stripe_enabled</code> se active, acá vas a poder agregar una.
        </div>
        <div className="mt-2 flex gap-2">
          <button disabled className="px-3 py-1.5 text-xs rounded-lg border border-border text-body-muted cursor-not-allowed">
            Actualizar método de pago
          </button>
          <button disabled className="px-3 py-1.5 text-xs rounded-lg border border-border text-body-muted cursor-not-allowed">
            Gestionar suscripción
          </button>
        </div>
      </section>

      <section>
        <h4 className="font-display text-lg mb-2">Periodo de prueba</h4>
        <p className="text-sm text-body-secondary">
          Como todavía estás en beta, el periodo de prueba no aplica. Cuando Stripe esté activo, acá se mostrará la fecha de fin de tu trial.
        </p>
      </section>

      <section className="pt-6 border-t border-border">
        <h4 className="font-display text-lg mb-2 text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} /> Zona de peligro
        </h4>
        <p className="text-sm text-body-secondary mb-3">
          Eliminar el hub borra todos los cursos, posts, miembros y datos asociados. Esta acción no se puede deshacer.
        </p>
        {confirmDelete ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
            <p className="text-sm text-red-900 font-medium">¿Estás segura? Esto es irreversible.</p>
            <p className="text-xs text-red-800">
              Esta acción está deshabilitada durante la beta. Si realmente querés eliminar el hub, contactá soporte.
            </p>
            <div className="flex gap-2">
              <button
                disabled
                className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white opacity-60 cursor-not-allowed"
              >
                Eliminar hub (deshabilitado)
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
          >
            Eliminar hub
          </button>
        )}
      </section>
    </div>
  )
}

/* ─── Locked pane ───────────────────────────────────── */

function LockedPane({ title }: { title: string }) {
  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={18} className="text-body-muted" />
        <h4 className="font-display text-xl">{title}</h4>
      </div>
      <p className="text-sm text-body-secondary">
        Esta sección llega en un sprint próximo. Mientras tanto, el hub funciona con los valores por defecto.
      </p>
    </div>
  )
}

/* ─── Primitives ────────────────────────────────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-medium text-body-secondary">{label}</label>
        {hint && <span className="text-[11px] text-body-muted">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Radio({
  checked, onChange, title, description,
}: { checked: boolean; onChange: () => void; title: string; description: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full text-left p-3 rounded-lg border transition ${
        checked ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-border hover:border-brand-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
          checked ? 'border-brand-500' : 'border-border'
        }`}>
          {checked && <span className="w-2 h-2 rounded-full bg-brand-500" style={{ backgroundColor: 'rgb(var(--brand))' }} />}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-xs text-body-secondary mt-0.5 ml-5">{description}</p>
    </button>
  )
}

function Switch({
  checked, onChange, loading,
}: { checked: boolean; onChange: (v: boolean) => void; loading?: boolean }) {
  return (
    <button
      onClick={() => !loading && onChange(!checked)}
      disabled={loading}
      className={`relative inline-flex w-10 h-6 rounded-full transition ${
        checked ? 'bg-brand-500' : 'bg-surface-secondary border border-border'
      }`}
      style={checked ? { backgroundColor: 'rgb(var(--brand))' } : undefined}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        } flex items-center justify-center`}
      >
        {loading && <Loader2 size={10} className="animate-spin text-body-muted" />}
      </span>
    </button>
  )
}
