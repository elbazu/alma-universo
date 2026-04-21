'use client'

/**
 * CommunitySettingsModal — admin-only hub configuration.
 *
 * Sprint 2 built: General, Pestañas, Facturación.
 * Sprint 1 adds: Categorías, Reglas (between Pestañas and the locked items).
 */

import { useEffect, useRef, useState, ReactNode, ChangeEvent } from 'react'
import {
  X, Home, Compass, Settings2, Wallet, Tag, Users, Puzzle,
  Shield, LayoutGrid, CreditCard, AlertTriangle, Loader2, Check,
  List, BookOpen,
} from 'lucide-react'
import { useCommunityData } from '@/context/CommunityDataContext'
import { slugify } from '@/lib/community'
import CategoriesPane from '@/components/community-settings/panes/CategoriesPane'
import RulesPane from '@/components/community-settings/panes/RulesPane'

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-surface-secondary border border-border rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ' +
  'placeholder:text-body-muted text-body transition'

type PaneKey =
  | 'general' | 'tabs' | 'categories' | 'rules' | 'billing'
  | 'dashboard' | 'discovery' | 'payouts' | 'pricing' | 'affiliates' | 'plugins'

interface NavItem {
  key: PaneKey
  label: string
  icon: ReactNode
  locked?: boolean
}

const NAV: NavItem[] = [
  // Sprint 3+ (locked)
  { key: 'dashboard',   label: 'Panel',       icon: <Home size={16} />,       locked: true },
  { key: 'discovery',   label: 'Descubrir',   icon: <Compass size={16} />,    locked: true },
  // Sprint 2 — active
  { key: 'general',     label: 'General',     icon: <Settings2 size={16} /> },
  { key: 'tabs',        label: 'Pestañas',    icon: <LayoutGrid size={16} /> },
  // Sprint 1 — NEW
  { key: 'categories',  label: 'Categorías',  icon: <List size={16} /> },
  { key: 'rules',       label: 'Reglas',      icon: <BookOpen size={16} /> },
  // Sprint 3+ (locked)
  { key: 'payouts',     label: 'Cobros',      icon: <Wallet size={16} />,     locked: true },
  { key: 'pricing',     label: 'Precios',     icon: <Tag size={16} />,        locked: true },
  { key: 'affiliates',  label: 'Afiliados',   icon: <Users size={16} />,      locked: true },
  { key: 'plugins',     label: 'Plugins',     icon: <Puzzle size={16} />,     locked: true },
  // Sprint 2 — active
  { key: 'billing',     label: 'Facturación', icon: <CreditCard size={16} /> },
]

const PANE_TITLES: Record<PaneKey, string> = {
  dashboard:   'Panel',
  discovery:   'Descubrir',
  general:     'General',
  tabs:        'Pestañas del hub',
  categories:  'Categorías',
  rules:       'Reglas',
  payouts:     'Cobros',
  pricing:     'Precios',
  affiliates:  'Afiliados',
  plugins:     'Plugins',
  billing:     'Facturación',
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
        className="bg-surface text-body w-full max-w-3xl h-[80vh] max-h-[640px] rounded-2xl shadow-2xl border border-border flex overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Left nav */}
        <aside className="w-56 bg-surface-secondary border-r border-border flex flex-col flex-shrink-0">
          <div className="px-4 h-12 flex items-center justify-between border-b border-border">
            <h2 className="text-sm font-semibold">Configurar comunidad</h2>
          </div>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {NAV.map(item => (
              <button
                key={item.key}
                disabled={item.locked}
                onClick={() => !item.locked && setPane(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition text-left ${
                  item.locked
                    ? 'opacity-40 cursor-not-allowed text-body-muted'
                    : pane === item.key
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-body-muted hover:bg-surface hover:text-body'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.locked && (
                  <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                    Próx.
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-12 px-6 flex items-center justify-between border-b border-border flex-shrink-0">
            <h3 className="text-sm font-semibold">{selected ? PANE_TITLES[selected.key] : ''}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-body-muted hover:text-body hover:bg-surface-secondary transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Pane content */}
          <div className="flex-1 overflow-y-auto p-6">
            {pane === 'general'    && <GeneralPane />}
            {pane === 'tabs'       && <TabsPane />}
            {pane === 'categories' && <CategoriesPane />}
            {pane === 'rules'      && <RulesPane />}
            {pane === 'billing'    && <BillingPane />}
            {NAV.find(n => n.key === pane)?.locked && <LockedPane label={PANE_TITLES[pane]} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Locked pane placeholder ─────────────────────────────────────────────────

function LockedPane({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Shield size={20} className="text-gray-400" />
      </div>
      <p className="font-medium text-body">{label}</p>
      <p className="text-sm text-body-muted mt-1">Disponible en un sprint próximo.</p>
    </div>
  )
}

// ─── General pane ────────────────────────────────────────────────────────────

function GeneralPane() {
  const { settings, refresh, save, saveFiles } = useCommunityData()
  const [name, setName] = useState(settings?.name ?? '')
  const [description, setDescription] = useState(settings?.description ?? '')
  const [urlSlug, setUrlSlug] = useState(settings?.url_slug ?? '')
  const [supportEmail, setSupportEmail] = useState(settings?.support_email ?? '')
  const [isPublic, setIsPublic] = useState(settings?.is_public ?? true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const iconRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  // Sync when settings loads
  useEffect(() => {
    if (!settings) return
    setName(settings.name ?? '')
    setDescription(settings.description ?? '')
    setUrlSlug(settings.url_slug ?? '')
    setSupportEmail(settings.support_email ?? '')
    setIsPublic(settings.is_public ?? true)
  }, [settings])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    setError('')
    try {
      await save({
        name: name.trim(),
        description: description.trim(),
        url_slug: slugify(urlSlug || name),
        support_email: supportEmail.trim(),
        is_public: isPublic,
      })
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleFileUpload(field: 'icon' | 'cover', file: File) {
    try {
      await saveFiles(field === 'icon' ? { icon: file } : { cover: file })
      await refresh()
    } catch {
      setError('Error al subir la imagen.')
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Cover / Icon uploads */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-body mb-1">
            Portada <span className="text-body-muted font-normal">(1084 × 576 px, máx 5 MB)</span>
          </label>
          <input ref={coverRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0]; if (f) handleFileUpload('cover', f)
            }} />
          <button type="button" onClick={() => coverRef.current?.click()}
            className="text-sm text-brand-600 hover:underline">
            {settings?.cover_url ? 'Cambiar portada' : 'Subir portada'}
          </button>
        </div>
        <div>
          <label className="block text-xs font-medium text-body mb-1">
            Icono del hub <span className="text-body-muted font-normal">(128 × 128 px, máx 2 MB)</span>
          </label>
          <input ref={iconRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0]; if (f) handleFileUpload('icon', f)
            }} />
          <button type="button" onClick={() => iconRef.current?.click()}
            className="text-sm text-brand-600 hover:underline">
            {settings?.icon_url ? 'Cambiar icono' : 'Subir icono'}
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-body mb-1">
            Nombre del hub <span className="text-body-muted">(máx 30 caracteres)</span>
          </label>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={30}
            placeholder="Mi Alma en el Universo" className={INPUT_CLASS} />
        </div>

        <div>
          <label className="block text-xs font-medium text-body mb-1">
            Descripción <span className="text-body-muted">(máx 150 caracteres)</span>
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            maxLength={150} rows={3} placeholder="Describe tu comunidad…"
            className={INPUT_CLASS + ' resize-none'} />
          <p className="text-xs text-body-muted text-right mt-0.5">{description.length}/150</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-body mb-1">URL personalizada</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-body-muted flex-shrink-0">mialmauniverso.com/</span>
            <input value={urlSlug} onChange={e => setUrlSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="mi-comunidad" className={INPUT_CLASS} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-body mb-1">Email de soporte</label>
          <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)}
            placeholder="hola@mialmauniverso.com" className={INPUT_CLASS} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-body">Visibilidad</p>
            <p className="text-xs text-body-muted mt-0.5">
              {isPublic ? 'Público — visible en búsquedas' : 'Privado — solo miembros con link'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(p => !p)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-brand-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex justify-end pt-2 border-t border-border">
        <button type="submit" disabled={saving}
          className="px-5 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2">
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

// ─── Tabs pane ───────────────────────────────────────────────────────────────

function TabsPane() {
  const { settings, refresh, save } = useCommunityData()
  const [classroomOn, setClassroomOn] = useState(settings?.show_classroom_tab ?? true)
  const [calendarOn, setCalendarOn] = useState(settings?.show_calendar_tab ?? true)
  const [mapOn, setMapOn] = useState(settings?.show_map_tab ?? false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!settings) return
    setClassroomOn(settings.show_classroom_tab ?? true)
    setCalendarOn(settings.show_calendar_tab ?? true)
    setMapOn(settings.show_map_tab ?? false)
  }, [settings])

  const tabs = [
    { label: 'Classroom', desc: 'Cursos, módulos y lecciones.', value: classroomOn, set: setClassroomOn, field: 'show_classroom_tab' },
    { label: 'Calendario', desc: 'Eventos en vivo y sesiones.', value: calendarOn, set: setCalendarOn, field: 'show_calendar_tab' },
    { label: 'Mapa', desc: 'Mapa de miembros.', value: mapOn, set: setMapOn, field: 'show_map_tab' },
  ]

  async function handleSave() {
    setSaving(true)
    try {
      await save({
        show_classroom_tab: classroomOn,
        show_calendar_tab: calendarOn,
        show_map_tab: mapOn,
      })
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-body-muted">
        Activa o desactiva las pestañas que aparecen en la navegación principal.
      </p>
      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
        {tabs.map(tab => (
          <div key={tab.field} className="flex items-center justify-between px-4 py-3 bg-surface">
            <div>
              <p className="text-sm font-medium text-body">{tab.label}</p>
              <p className="text-xs text-body-muted">{tab.desc}</p>
            </div>
            <button
              onClick={() => tab.set(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${tab.value ? 'bg-brand-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tab.value ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2">
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── Billing pane ────────────────────────────────────────────────────────────

function BillingPane() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <div className="space-y-5">
      {/* Beta banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Modo beta</p>
          <p className="text-xs text-amber-700 mt-0.5">
            La facturación y pagos estarán disponibles en Sprint 7 cuando se active Stripe.
            Por ahora todos los usuarios tienen acceso gratuito.
          </p>
        </div>
      </div>

      {/* Plan card */}
      <div className="border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-body">Plan actual</p>
            <p className="text-xs text-body-muted">Hobby — Gratis</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Activo</span>
        </div>
        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-body-muted">Método de pago</span>
            <span className="text-body">—</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-body-muted">Próximo cobro</span>
            <span className="text-body">—</span>
          </div>
        </div>
        <div className="border-t border-border pt-3 flex flex-col gap-2">
          <button disabled
            className="w-full py-2 text-sm border border-border rounded-lg text-body-muted cursor-not-allowed opacity-50">
            Actualizar método de pago
          </button>
          <button disabled
            className="w-full py-2 text-sm border border-border rounded-lg text-body-muted cursor-not-allowed opacity-50">
            Gestionar suscripción
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-red-700">Zona peligrosa</p>
        <p className="text-xs text-body-muted">
          Eliminar el hub borrará todo el contenido, miembros y configuración de forma permanente.
        </p>
        {showDeleteConfirm ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-600">¿Estás segura? Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-1.5 text-xs border border-border rounded-lg text-body-muted hover:text-body transition">
                Cancelar
              </button>
              <button disabled
                className="flex-1 py-1.5 text-xs rounded-lg bg-red-500 text-white opacity-50 cursor-not-allowed">
                Confirmar (desactivado en beta)
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 text-sm border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition">
            Eliminar hub
          </button>
        )}
      </div>
    </div>
  )
}
