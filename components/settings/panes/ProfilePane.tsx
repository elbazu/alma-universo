'use client'

/**
 * Sprint 4 — B-2 Profile pane.
 *
 * Fields implemented in this pane:
 *   - Avatar (upload / remove)
 *   - First name, Last name (one-time rename rule — see RENAME_GATE_ENABLED)
 *   - Username / URL slug (90-day + 30 followers + 90 contributions gate —
 *     stored but disabled while USERNAME_GATE_ENABLED = false in beta)
 *   - Bio (300 chars)
 *   - Location text (+ future map pin — text only for beta)
 *   - Myers–Briggs (16-type select)
 *   - Social links (stacked list, up/down reorder, platform + URL)
 *   - Visibility toggles widget (location / join date / online status)
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  User as UserIcon,
  ImagePlus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  Instagram,
  Youtube,
  Globe,
  Twitter,
  Linkedin,
  Facebook,
  Music2,
  LucideIcon,
} from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { useAuth } from '@/context/AuthContext'
import {
  MyersBriggs,
  SocialLink,
  SocialPlatform,
  slugifyUsername,
} from '@/lib/profile'

// Beta flags — wired in as literals so they're trivially greppable when
// Sprint 7 flips paywall on. Move to FlagsContext once they're dynamic.
const RENAME_GATE_ENABLED = false
const USERNAME_GATE_ENABLED = false

const MBTI_OPTIONS: MyersBriggs[] = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
]

const PLATFORM_META: Record<SocialPlatform, { label: string; icon: LucideIcon }> = {
  instagram: { label: 'Instagram', icon: Instagram },
  youtube:   { label: 'YouTube',   icon: Youtube },
  tiktok:    { label: 'TikTok',    icon: Music2 },
  twitter:   { label: 'Twitter / X', icon: Twitter },
  linkedin:  { label: 'LinkedIn',  icon: Linkedin },
  facebook:  { label: 'Facebook',  icon: Facebook },
  website:   { label: 'Sitio web', icon: Globe },
}

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-border bg-surface text-body ' +
  'placeholder:text-body-muted focus:outline-none focus:ring-2 focus:ring-brand/40 ' +
  'text-sm transition'

const LABEL_CLASS = 'block text-xs font-medium text-body-secondary mb-1.5'

export default function ProfilePane() {
  const { user } = useAuth()
  const { profile, isLoading, save, saveAvatar, clearAvatar } = useProfile()

  // Local draft state so we can show a single "Guardar" action.
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [username,  setUsername]  = useState('')
  const [bio,       setBio]       = useState('')
  const [location,  setLocation]  = useState('')
  const [mbti,      setMbti]      = useState<MyersBriggs | ''>('')
  const [links,     setLinks]     = useState<SocialLink[]>([])
  const [showLocation,       setShowLocation]       = useState(true)
  const [showMembershipDate, setShowMembershipDate] = useState(true)
  const [showOnlineStatus,   setShowOnlineStatus]   = useState(false)

  const [saving,  setSaving]  = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [err,     setErr]     = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Seed form state when profile loads.
  useEffect(() => {
    if (!profile) return
    setFirstName(profile.first_name)
    setLastName(profile.last_name)
    setUsername(profile.username)
    setBio(profile.bio)
    setLocation(profile.location_text)
    setMbti(profile.myers_briggs || '')
    setLinks(profile.social_links || [])
    setShowLocation(profile.show_location)
    setShowMembershipDate(profile.show_membership_date)
    setShowOnlineStatus(profile.show_online_status)
  }, [profile])

  const hasNameBeenRenamed = Boolean(profile?.name_renamed_at)
  const nameInputsDisabled = RENAME_GATE_ENABLED && hasNameBeenRenamed
  const usernameDisabled = USERNAME_GATE_ENABLED // gate off in beta → editable

  const dirty = useMemo(() => {
    if (!profile) return false
    if (firstName !== profile.first_name) return true
    if (lastName  !== profile.last_name)  return true
    if (username  !== profile.username)   return true
    if (bio       !== profile.bio)        return true
    if (location  !== profile.location_text) return true
    if (mbti      !== (profile.myers_briggs || '')) return true
    if (showLocation       !== profile.show_location)       return true
    if (showMembershipDate !== profile.show_membership_date) return true
    if (showOnlineStatus   !== profile.show_online_status)   return true
    // Links: compare by serialization — order matters.
    if (JSON.stringify(links) !== JSON.stringify(profile.social_links || [])) return true
    return false
  }, [profile, firstName, lastName, username, bio, location, mbti, links, showLocation, showMembershipDate, showOnlineStatus])

  async function handleSave() {
    if (!profile || saving) return
    setSaving(true)
    setErr(null)
    try {
      const patch: Record<string, unknown> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: slugifyUsername(username.trim()),
        bio: bio.trim(),
        location_text: location.trim(),
        myers_briggs: mbti || null,
        social_links: links.filter((l) => l.url.trim().length > 0),
        show_location: showLocation,
        show_membership_date: showMembershipDate,
        show_online_status: showOnlineStatus,
      }
      // Mark rename-at if the display name changed and we haven't recorded it.
      if (
        RENAME_GATE_ENABLED &&
        !profile.name_renamed_at &&
        (firstName !== profile.first_name || lastName !== profile.last_name)
      ) {
        patch.name_renamed_at = new Date().toISOString()
      }
      if (USERNAME_GATE_ENABLED && username !== profile.username) {
        patch.username_changed_at = new Date().toISOString()
      }
      await save(patch as never)
      setSavedAt(new Date())
    } catch (e) {
      setErr((e as Error)?.message || 'No se pudo guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarPick(files: FileList | null) {
    if (!files?.length) return
    setSaving(true)
    setErr(null)
    try {
      await saveAvatar(files[0])
    } catch (e) {
      setErr((e as Error)?.message || 'No se pudo subir la foto.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarClear() {
    if (!profile?.avatar_url) return
    setSaving(true)
    setErr(null)
    try {
      await clearAvatar()
    } catch (e) {
      setErr((e as Error)?.message || 'No se pudo quitar la foto.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="text-sm text-body-secondary">
        Iniciá sesión para ver tu perfil.
      </div>
    )
  }

  if (isLoading || !profile) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-40 bg-surface-secondary rounded" />
        <div className="h-10 w-full bg-surface-secondary rounded" />
        <div className="h-10 w-full bg-surface-secondary rounded" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header: avatar + basic info */}
      <section>
        <h4 className="font-display text-xl mb-1">Perfil</h4>
        <p className="text-sm text-body-secondary mb-4">
          Así te ven los demás miembros. Podés actualizar esta información cuando quieras.
        </p>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-surface-secondary border border-border overflow-hidden flex items-center justify-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={28} className="text-body-muted" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-secondary transition"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              >
                <ImagePlus size={14} />
                {profile.avatar_url ? 'Cambiar foto' : 'Subir foto'}
              </button>
              {profile.avatar_url && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-secondary transition text-body-secondary"
                  onClick={handleAvatarClear}
                  disabled={saving}
                >
                  <Trash2 size={14} />
                  Quitar
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleAvatarPick(e.target.files)}
              />
            </div>
            <p className="text-xs text-body-muted">JPG, PNG o WebP. Máximo 2 MB.</p>
          </div>
        </div>
      </section>

      {/* Name */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Nombre</label>
          <input
            className={INPUT_CLASS}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={40}
            disabled={nameInputsDisabled}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Apellido</label>
          <input
            className={INPUT_CLASS}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={40}
            disabled={nameInputsDisabled}
          />
        </div>
        {nameInputsDisabled && (
          <p className="sm:col-span-2 text-xs text-body-muted">
            Ya cambiaste tu nombre una vez. Para volver a cambiarlo, escribinos a soporte.
          </p>
        )}
      </section>

      {/* Username / URL */}
      <section>
        <label className={LABEL_CLASS}>URL del perfil</label>
        <div className="flex items-stretch gap-2">
          <span className="inline-flex items-center px-3 rounded-lg border border-border bg-surface-secondary text-xs text-body-muted">
            mialmauniverso.com/u/
          </span>
          <input
            className={INPUT_CLASS + ' flex-1'}
            value={username}
            onChange={(e) => setUsername(slugifyUsername(e.target.value))}
            placeholder="tu-usuario"
            maxLength={30}
            disabled={usernameDisabled}
          />
        </div>
        <p className="text-xs text-body-muted mt-1.5">
          Letras minúsculas, números, guion o guion bajo.
          {USERNAME_GATE_ENABLED && ' Podés cambiarla una vez cada 90 días.'}
        </p>
      </section>

      {/* Bio */}
      <section>
        <label className={LABEL_CLASS}>Biografía</label>
        <textarea
          className={INPUT_CLASS + ' min-h-24 resize-y'}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          placeholder="Contanos en pocas palabras quién sos y qué buscás."
        />
        <p className="text-xs text-body-muted mt-1 text-right">{bio.length}/300</p>
      </section>

      {/* Location + Myers-Briggs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Ubicación</label>
          <input
            className={INPUT_CLASS}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={80}
            placeholder="Ciudad, país"
          />
          <p className="text-xs text-body-muted mt-1">Aparecerá en el mapa cuando lo habilitemos.</p>
        </div>
        <div>
          <label className={LABEL_CLASS}>Myers–Briggs</label>
          <select
            className={INPUT_CLASS}
            value={mbti}
            onChange={(e) => setMbti(e.target.value as MyersBriggs | '')}
          >
            <option value="">Prefiero no decir</option>
            {MBTI_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Social links */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-semibold">Redes sociales</h5>
          <AddLinkButton onAdd={(l) => setLinks([...links, l])} existing={links} />
        </div>
        {links.length === 0 ? (
          <p className="text-xs text-body-muted">No agregaste redes todavía. Agregá las que quieras mostrar en tu perfil.</p>
        ) : (
          <ul className="space-y-2">
            {links.map((link, idx) => (
              <SocialLinkRow
                key={idx}
                link={link}
                first={idx === 0}
                last={idx === links.length - 1}
                onChange={(next) => setLinks(links.map((l, i) => (i === idx ? next : l)))}
                onRemove={() => setLinks(links.filter((_, i) => i !== idx))}
                onMoveUp={() =>
                  setLinks((prev) => {
                    if (idx === 0) return prev
                    const out = [...prev]
                    ;[out[idx - 1], out[idx]] = [out[idx], out[idx - 1]]
                    return out
                  })
                }
                onMoveDown={() =>
                  setLinks((prev) => {
                    if (idx === prev.length - 1) return prev
                    const out = [...prev]
                    ;[out[idx + 1], out[idx]] = [out[idx], out[idx + 1]]
                    return out
                  })
                }
              />
            ))}
          </ul>
        )}
      </section>

      {/* Visibility widget */}
      <section className="rounded-xl border border-border p-4 space-y-3">
        <div>
          <h5 className="text-sm font-semibold">Visibilidad de tu membresía</h5>
          <p className="text-xs text-body-secondary">Elegí qué información tuya es pública.</p>
        </div>
        <VisibilityToggle
          label="Mostrar mi ubicación"
          hint="Aparece en tu perfil y en el mapa."
          checked={showLocation}
          onChange={setShowLocation}
        />
        <VisibilityToggle
          label="Mostrar la fecha en que me uní"
          hint="Se ve como “Miembro desde abril 2026”."
          checked={showMembershipDate}
          onChange={setShowMembershipDate}
        />
        <VisibilityToggle
          label="Mostrar si estoy en línea"
          hint="Un punto verde junto a tu avatar cuando estés activa."
          checked={showOnlineStatus}
          onChange={setShowOnlineStatus}
        />
      </section>

      {/* Save bar */}
      <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 bg-surface border-t border-border flex items-center justify-between">
        <div className="text-xs">
          {err ? (
            <span className="text-red-600">{err}</span>
          ) : savedAt ? (
            <span className="text-body-muted">Guardado · {formatTime(savedAt)}</span>
          ) : dirty ? (
            <span className="text-body-muted">Hay cambios sin guardar.</span>
          ) : (
            <span className="text-body-muted">Todo al día.</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-4 py-1.5 text-sm rounded-lg bg-brand text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          style={{ backgroundColor: 'rgb(var(--brand))' }}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

/* ─── Sub-components ──────────────────────────────────── */

function AddLinkButton({
  onAdd,
  existing,
}: {
  onAdd: (l: SocialLink) => void
  existing: SocialLink[]
}) {
  const [open, setOpen] = useState(false)
  const platforms = Object.keys(PLATFORM_META) as SocialPlatform[]
  // Allow duplicates (e.g., two websites), but prefer platforms not yet added.
  const unused = platforms.filter((p) => !existing.find((l) => l.platform === p))
  const fallback = platforms[0]
  const defaultPlatform = unused[0] || fallback

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-border hover:bg-surface-secondary transition"
      >
        <Plus size={12} />
        Agregar red
      </button>
    )
  }

  return (
    <div className="flex gap-1">
      {platforms.map((p) => {
        const Icon = PLATFORM_META[p].icon
        const isDefault = p === defaultPlatform
        return (
          <button
            key={p}
            type="button"
            onClick={() => {
              onAdd({ platform: p, url: '' })
              setOpen(false)
            }}
            className={`p-1.5 rounded-lg border border-border hover:bg-surface-secondary transition ${isDefault ? 'ring-1 ring-brand/30' : ''}`}
            title={PLATFORM_META[p].label}
          >
            <Icon size={14} />
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="p-1.5 rounded-lg text-body-muted hover:bg-surface-secondary transition"
        title="Cancelar"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function SocialLinkRow({
  link,
  first,
  last,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  link: SocialLink
  first: boolean
  last: boolean
  onChange: (next: SocialLink) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const meta = PLATFORM_META[link.platform]
  const Icon = meta.icon
  return (
    <li className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-border bg-surface-secondary">
        <Icon size={14} />
        <span className="text-xs font-medium whitespace-nowrap">{meta.label}</span>
      </div>
      <input
        className={INPUT_CLASS + ' flex-1'}
        value={link.url}
        onChange={(e) => onChange({ ...link, url: e.target.value })}
        placeholder="https://…"
      />
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={first}
          className="p-1.5 rounded hover:bg-surface-secondary text-body-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Subir"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={last}
          className="p-1.5 rounded hover:bg-surface-secondary text-body-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Bajar"
        >
          <ArrowDown size={14} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded hover:bg-surface-secondary text-body-muted transition"
          title="Quitar"
        >
          <X size={14} />
        </button>
      </div>
    </li>
  )
}

function VisibilityToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`mt-0.5 w-9 h-5 rounded-full relative transition ${checked ? 'bg-brand' : 'bg-surface-secondary border border-border'}`}
        style={checked ? { backgroundColor: 'rgb(var(--brand))' } : undefined}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 ${checked ? 'left-4' : 'left-0.5'} w-4 h-4 rounded-full bg-white shadow transition-all`}
        />
      </button>
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-body-muted">{hint}</div>}
      </div>
    </label>
  )
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
