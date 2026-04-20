'use client'

import { useEffect, useState, ReactNode } from 'react'
import { X, User, Palette, Bell, CreditCard, Shield, BookOpen } from 'lucide-react'
import { useTheme, ThemeChoice } from '@/context/ThemeContext'
import { useFlag } from '@/context/FlagsContext'
import ProfilePane from './panes/ProfilePane'
import AccountPane from './panes/AccountPane'
import MisCursosPane from './panes/MisCursosPane'

type PaneKey =
  | 'profile'
  | 'mis-cursos'
  | 'appearance'
  | 'notifications'
  | 'billing'
  | 'account'

interface NavItem {
  key: PaneKey
  label: string
  icon: ReactNode
  flag?: 'stripe_enabled'
}

const NAV: NavItem[] = [
  { key: 'profile',       label: 'Perfil',         icon: <User size={16} /> },
  { key: 'mis-cursos',    label: 'Mis cursos',     icon: <BookOpen size={16} /> },
  { key: 'appearance',    label: 'Apariencia',     icon: <Palette size={16} /> },
  { key: 'notifications', label: 'Notificaciones', icon: <Bell size={16} /> },
  { key: 'account',       label: 'Cuenta',         icon: <Shield size={16} /> },
  { key: 'billing',       label: 'Facturación',    icon: <CreditCard size={16} />, flag: 'stripe_enabled' },
]

const PANE_TITLES: Record<PaneKey, string> = {
  profile:       'Perfil',
  'mis-cursos':  'Mis cursos',
  appearance:    'Apariencia',
  notifications: 'Notificaciones',
  billing:       'Facturación',
  account:       'Cuenta',
}

interface Props {
  open: boolean
  onClose: () => void
  initialPane?: PaneKey
}

export default function SettingsModal({ open, onClose, initialPane = 'profile' }: Props) {
  const [pane, setPane] = useState<PaneKey>(initialPane)
  const stripeEnabled = useFlag('stripe_enabled')

  useEffect(() => { if (open) setPane(initialPane) }, [open, initialPane])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const visibleNav = NAV.filter(n => !n.flag || (n.flag === 'stripe_enabled' && stripeEnabled) || n.key === 'billing')

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface text-body w-full max-w-3xl h-[80vh] max-h-[640px] rounded-2xl shadow-2xl border border-border flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left nav */}
        <aside className="w-56 bg-surface-secondary border-r border-border flex flex-col">
          <div className="px-4 h-12 flex items-center justify-between border-b border-border">
            <h2 className="text-sm font-semibold">Configuración</h2>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            {visibleNav.map(item => (
              <button
                key={item.key}
                onClick={() => setPane(item.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  pane === item.key
                    ? 'bg-brand-soft text-brand'
                    : 'text-body-secondary hover:bg-surface hover:text-body'
                }`}
                style={pane === item.key ? { backgroundColor: 'rgb(var(--brand-soft))', color: 'rgb(var(--brand))' } : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content pane */}
        <section className="flex-1 flex flex-col">
          <header className="h-12 px-5 flex items-center justify-between border-b border-border">
            <h3 className="text-sm font-semibold">{PANE_TITLES[pane]}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-body-muted hover:text-body transition"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            {pane === 'profile' && <ProfilePane />}
            {pane === 'mis-cursos' && <MisCursosPane />}
            {pane === 'appearance' && <AppearancePane />}
            {pane === 'notifications' && <NotificationsPane />}
            {pane === 'billing' && <BillingPane enabled={stripeEnabled} />}
            {pane === 'account' && <AccountPane />}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ─── Paneles ───────────────────────────────────────── */

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-md">
      <h4 className="font-display text-xl mb-2">{title}</h4>
      <p className="text-sm text-body-secondary">{body}</p>
    </div>
  )
}

function AppearancePane() {
  const { choice, setChoice } = useTheme()
  const options: { key: ThemeChoice; label: string; description: string }[] = [
    { key: 'light',  label: 'Claro',      description: 'Crema y terracota — la sensación de día.' },
    { key: 'dark',   label: 'Oscuro',     description: 'Negros cálidos con acentos ámbar suaves.' },
    { key: 'system', label: 'Del sistema', description: 'Sigue la preferencia de tu dispositivo automáticamente.' },
  ]
  return (
    <div className="max-w-md">
      <h4 className="font-display text-xl mb-1">Tema</h4>
      <p className="text-sm text-body-secondary mb-4">Elegí cómo se ve el hub. Tu elección se guarda en este dispositivo.</p>
      <div className="space-y-2">
        {options.map(opt => (
          <button
            key={opt.key}
            onClick={() => setChoice(opt.key)}
            className={`w-full text-left p-3 rounded-lg border transition ${
              choice === opt.key
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                : 'border-border hover:border-brand-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{opt.label}</span>
              {choice === opt.key && (
                <span className="text-xs text-brand-600 font-semibold">Activo</span>
              )}
            </div>
            <p className="text-xs text-body-secondary mt-0.5">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function NotificationsPane() {
  return (
    <Placeholder
      title="Notificaciones"
      body="Elegí sobre qué querés recibir aviso — comentarios, menciones, reacciones, eventos. El cableado a la colección user_preferences llega en Sprint 5."
    />
  )
}

function BillingPane({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <div className="max-w-md">
        <h4 className="font-display text-xl mb-1">Facturación</h4>
        <p className="text-sm text-body-secondary mb-4">
          La facturación está apagada — durante la beta todo es gratis. Cuando se lancen los cursos pagos, acá vas a ver tus métodos de pago guardados y tus facturas.
        </p>
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-body-muted">
          Todavía no hay métodos de pago registrados.
        </div>
      </div>
    )
  }
  return (
    <Placeholder
      title="Facturación"
      body="Aquí van a aparecer los métodos de pago, las facturas y las suscripciones manejadas con Stripe."
    />
  )
}

