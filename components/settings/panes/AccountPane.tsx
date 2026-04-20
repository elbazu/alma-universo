'use client'

/**
 * Sprint 4 — B-5 Cuenta pane.
 *
 * - Change email: PocketBase sends a verification email to the NEW address;
 *   the change takes effect when the user clicks the link.
 * - Change password: current + new + confirm. Succeeds immediately. Rotates
 *   PB `tokenKey` server-side, invalidating all other sessions — this is
 *   our implementation of "cerrar sesión en todos los dispositivos".
 * - Timezone: saved to `user_preferences.timezone`. Used later by email
 *   digests and scheduled notifications.
 * - Sign out: PB authStore.clear() on this device (hub nav already has a
 *   sign-out option; this duplicates it for discoverability).
 */

import { useEffect, useState } from 'react'
import { Mail, Lock, Clock, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getPb } from '@/lib/pocketbase'

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-border bg-surface text-body ' +
  'placeholder:text-body-muted focus:outline-none focus:ring-2 focus:ring-brand/40 ' +
  'text-sm transition'

const LABEL_CLASS = 'block text-xs font-medium text-body-secondary mb-1.5'

// Common timezones — Alma-centric first (Mexico, Spain), then broad set.
const TIMEZONES: { value: string; label: string }[] = [
  { value: 'America/Mexico_City',  label: 'Ciudad de México (UTC−6)' },
  { value: 'America/Monterrey',    label: 'Monterrey (UTC−6)' },
  { value: 'America/Tijuana',      label: 'Tijuana (UTC−8)' },
  { value: 'America/Cancun',       label: 'Cancún (UTC−5)' },
  { value: 'America/Bogota',       label: 'Bogotá (UTC−5)' },
  { value: 'America/Lima',         label: 'Lima (UTC−5)' },
  { value: 'America/Santiago',     label: 'Santiago (UTC−4)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC−3)' },
  { value: 'America/Sao_Paulo',    label: 'São Paulo (UTC−3)' },
  { value: 'Europe/Madrid',        label: 'Madrid (UTC+1)' },
  { value: 'Europe/Barcelona',     label: 'Barcelona (UTC+1)' },
  { value: 'Atlantic/Canary',      label: 'Canarias (UTC+0)' },
  { value: 'America/Los_Angeles',  label: 'Los Angeles (UTC−8)' },
  { value: 'America/New_York',     label: 'New York (UTC−5)' },
  { value: 'UTC',                  label: 'UTC' },
]

type Msg = { kind: 'ok' | 'err'; text: string } | null

export default function AccountPane() {
  const { user, signOut } = useAuth()

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h4 className="font-display text-xl mb-1">Cuenta</h4>
        <p className="text-sm text-body-secondary">
          Tu correo, contraseña, zona horaria y sesiones activas.
        </p>
      </div>

      {!user ? (
        <p className="text-sm text-body-secondary">Iniciá sesión para ver esta sección.</p>
      ) : (
        <>
          <EmailSection userEmail={(user.email as string) || ''} />
          <PasswordSection />
          <TimezoneSection userId={user.id} />
          <SessionsSection onSignOut={signOut} />
        </>
      )}
    </div>
  )
}

/* ─── Email ─────────────────────────────────────────── */

function EmailSection({ userEmail }: { userEmail: string }) {
  const [newEmail, setNewEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim() || busy) return
    setBusy(true); setMsg(null)
    try {
      const pb = getPb()
      await pb.collection('users').requestEmailChange(newEmail.trim())
      setMsg({ kind: 'ok', text: `Te mandamos un correo a ${newEmail.trim()}. Hacé click en el link para confirmar el cambio.` })
      setNewEmail('')
    } catch (err) {
      setMsg({ kind: 'err', text: (err as Error)?.message || 'No se pudo enviar el correo de confirmación.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Mail size={16} className="text-body-secondary" />
        <h5 className="text-sm font-semibold">Correo electrónico</h5>
      </div>
      <p className="text-xs text-body-secondary mb-3">
        Tu correo actual es <span className="font-medium">{userEmail}</span>.
        Para cambiarlo, ingresá el nuevo correo y confirmalo desde tu bandeja.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          className={INPUT_CLASS + ' flex-1'}
          placeholder="nuevo@correo.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={busy || !newEmail.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
          style={{ backgroundColor: 'rgb(var(--brand))' }}
        >
          {busy ? 'Enviando…' : 'Enviar confirmación'}
        </button>
      </form>
      {msg && <Feedback msg={msg} />}
    </section>
  )
}

/* ─── Password ──────────────────────────────────────── */

function PasswordSection() {
  const { user } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (next.length < 8) {
      setMsg({ kind: 'err', text: 'La nueva contraseña debe tener al menos 8 caracteres.' })
      return
    }
    if (next !== confirm) {
      setMsg({ kind: 'err', text: 'Las contraseñas no coinciden.' })
      return
    }
    if (!user) return
    setBusy(true); setMsg(null)
    try {
      const pb = getPb()
      await pb.collection('users').update(user.id, {
        oldPassword: current,
        password: next,
        passwordConfirm: confirm,
      })
      setMsg({ kind: 'ok', text: 'Contraseña actualizada. Las otras sesiones se cerraron automáticamente.' })
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err) {
      setMsg({ kind: 'err', text: (err as Error)?.message || 'No se pudo actualizar. Revisá que la contraseña actual sea correcta.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lock size={16} className="text-body-secondary" />
        <h5 className="text-sm font-semibold">Contraseña</h5>
      </div>
      <p className="text-xs text-body-secondary mb-3">
        Cambiar la contraseña cierra sesión en todos tus otros dispositivos automáticamente.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={LABEL_CLASS}>Contraseña actual</label>
          <input
            type="password"
            className={INPUT_CLASS}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Contraseña nueva</label>
            <input
              type="password"
              className={INPUT_CLASS}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Repetir contraseña nueva</label>
            <input
              type="password"
              className={INPUT_CLASS}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          {msg ? <Feedback msg={msg} /> : <span />}
          <button
            type="submit"
            disabled={busy || !current || !next || !confirm}
            className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            style={{ backgroundColor: 'rgb(var(--brand))' }}
          >
            {busy ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </section>
  )
}

/* ─── Timezone ──────────────────────────────────────── */

function TimezoneSection({ userId }: { userId: string }) {
  const [tz, setTz] = useState<string>('')
  const [prefId, setPrefId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const pb = getPb()
        const rec = await pb.collection('user_preferences').getFirstListItem(
          `user="${userId}"`,
          { requestKey: `prefs_${userId}` }
        )
        if (cancelled) return
        setPrefId(rec.id as string)
        setTz((rec.timezone as string) || guessBrowserTz())
      } catch {
        // No prefs row yet — keep the default.
        if (cancelled) return
        setTz(guessBrowserTz())
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  async function handleSave() {
    if (busy) return
    setBusy(true); setMsg(null)
    try {
      const pb = getPb()
      if (prefId) {
        await pb.collection('user_preferences').update(prefId, { timezone: tz })
      } else {
        const created = await pb.collection('user_preferences').create({
          user: userId, timezone: tz,
        })
        setPrefId(created.id as string)
      }
      setMsg({ kind: 'ok', text: 'Zona horaria guardada.' })
    } catch (err) {
      setMsg({ kind: 'err', text: (err as Error)?.message || 'No se pudo guardar.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-body-secondary" />
        <h5 className="text-sm font-semibold">Zona horaria</h5>
      </div>
      <p className="text-xs text-body-secondary mb-3">
        Usamos tu zona horaria para mostrar fechas de eventos y mandarte resúmenes por correo en buen horario.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          className={INPUT_CLASS + ' flex-1'}
          value={tz}
          onChange={(e) => setTz(e.target.value)}
        >
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
          {!TIMEZONES.find((t) => t.value === tz) && tz && (
            <option value={tz}>{tz}</option>
          )}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-surface-secondary transition whitespace-nowrap disabled:opacity-50"
        >
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
      {msg && <Feedback msg={msg} />}
    </section>
  )
}

/* ─── Sessions ──────────────────────────────────────── */

function SessionsSection({ onSignOut }: { onSignOut: () => void }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <LogOut size={16} className="text-body-secondary" />
        <h5 className="text-sm font-semibold">Sesiones</h5>
      </div>
      <p className="text-xs text-body-secondary mb-3">
        Cerrar sesión solo en este dispositivo. Para cerrar sesión en todos los dispositivos, cambiá tu contraseña arriba.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-surface-secondary transition"
        >
          Cerrar sesión aquí
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSignOut}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:opacity-90 transition"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-surface-secondary transition"
          >
            Cancelar
          </button>
        </div>
      )}
    </section>
  )
}

/* ─── helpers ───────────────────────────────────────── */

function Feedback({ msg }: { msg: NonNullable<Msg> }) {
  const Icon = msg.kind === 'ok' ? CheckCircle2 : AlertCircle
  const tone = msg.kind === 'ok' ? 'text-emerald-700' : 'text-red-700'
  return (
    <p className={`mt-2 text-xs flex items-start gap-1.5 ${tone}`}>
      <Icon size={13} className="mt-0.5 flex-shrink-0" />
      <span>{msg.text}</span>
    </p>
  )
}

function guessBrowserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City'
  } catch {
    return 'America/Mexico_City'
  }
}
