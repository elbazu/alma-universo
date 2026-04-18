'use client'

import { useEffect, useState, ReactNode } from 'react'
import { X, User, Palette, Bell, CreditCard, Shield } from 'lucide-react'
import { useTheme, ThemeChoice } from '@/context/ThemeContext'
import { useFlag } from '@/context/FlagsContext'

type PaneKey = 'profile' | 'appearance' | 'notifications' | 'billing' | 'account'

interface NavItem {
  key: PaneKey
  label: string
  icon: ReactNode
  flag?: 'stripe_enabled'
}

const NAV: NavItem[] = [
  { key: 'profile',       label: 'Profile',       icon: <User size={16} /> },
  { key: 'appearance',    label: 'Appearance',    icon: <Palette size={16} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { key: 'billing',       label: 'Billing',       icon: <CreditCard size={16} />, flag: 'stripe_enabled' },
  { key: 'account',       label: 'Account',       icon: <Shield size={16} /> },
]

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
            <h2 className="text-sm font-semibold">Settings</h2>
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
            <h3 className="text-sm font-semibold capitalize">{pane}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-body-muted hover:text-body transition"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            {pane === 'profile' && <ProfilePane />}
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

/* ─── Panes ─────────────────────────────────────────── */

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-md">
      <h4 className="font-display text-xl mb-2">{title}</h4>
      <p className="text-sm text-body-secondary">{body}</p>
    </div>
  )
}

function ProfilePane() {
  return <Placeholder title="Your profile" body="Name, avatar, and bio editing will live here once the profile UI is built." />
}

function AppearancePane() {
  const { choice, setChoice } = useTheme()
  const options: { key: ThemeChoice; label: string; description: string }[] = [
    { key: 'light',  label: 'Light',  description: 'Cream and terracotta — the daytime feel.' },
    { key: 'dark',   label: 'Dark',   description: 'Warm blacks with soft amber accents.' },
    { key: 'system', label: 'System', description: 'Follow your device automatically.' },
  ]
  return (
    <div className="max-w-md">
      <h4 className="font-display text-xl mb-1">Theme</h4>
      <p className="text-sm text-body-secondary mb-4">Choose how the hub looks. Your choice is saved on this device.</p>
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
                <span className="text-xs text-brand-600 font-semibold">Active</span>
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
  return <Placeholder title="Notifications" body="Pick what you want to be notified about — comments, mentions, reactions, events. Wiring to PocketBase user_preferences lands in Sprint 1." />
}

function BillingPane({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <div className="max-w-md">
        <h4 className="font-display text-xl mb-1">Billing</h4>
        <p className="text-sm text-body-secondary mb-4">
          Billing is currently off — the beta is free for everyone. When paid courses launch, your saved payment methods and invoices will appear here.
        </p>
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-body-muted">
          No payment methods on file yet.
        </div>
      </div>
    )
  }
  return <Placeholder title="Billing" body="Stripe-backed payment methods, invoices, and subscriptions will render here." />
}

function AccountPane() {
  return <Placeholder title="Account" body="Email, password/magic-link, two-factor, and data export tools will live here." />
}
